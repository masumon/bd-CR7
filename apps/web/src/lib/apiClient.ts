import { appConfig, IS_PRODUCTION, LOCALHOST_URL_PATTERN } from "@/core/config";
import { getErrorMessage } from "@/lib/errorUtils";
import { supabase } from "@/lib/supabase";
import useOfflineQueue, { type QueueMethod } from "@/store/offlineQueue";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string | null;
};

export type QueuedApiResult = {
  __queued: true;
  __queueId: string;
  __queueMethod: QueueMethod;
  __queuePath: string;
};

export function isQueuedApiResult(value: unknown): value is QueuedApiResult {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as { __queued?: unknown }).__queued === true &&
    typeof (value as { __queueId?: unknown }).__queueId === "string"
  );
}

const buildUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = appConfig.apiBaseUrl;
  if (!base) return path;
  // Never forward requests to a localhost address in production — it is
  // unreachable from the internet. Fall back to same-origin /api/* routing so
  // the Next.js API proxy handles the actual server-to-Python forwarding.
  if (IS_PRODUCTION && LOCALHOST_URL_PATTERN.test(base)) {
    return path;
  }
  // Avoid duplicating the API prefix when callers pass /api/* and the base
  // URL is already configured with a trailing /api segment.
  if (base.endsWith("/api") && path.startsWith("/api/")) {
    return `${base}${path.slice(4)}`;
  }
  return `${base}${path}`;
};

const toErrorMessage = (payload: unknown, status: number) => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
      return "API returned HTML instead of JSON. Check NEXT_PUBLIC_API_URL and backend availability.";
    }
    if (trimmed) return trimmed;
  }
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const maybeEnvelope = payload as { error?: unknown; detail?: unknown };
    if (typeof maybeEnvelope.error === "string" && maybeEnvelope.error.trim()) return maybeEnvelope.error;
    if (typeof maybeEnvelope.detail === "string" && maybeEnvelope.detail.trim()) return maybeEnvelope.detail;
  }
  return `Request failed (${status})`;
};

const QUEUEABLE_METHODS: QueueMethod[] = ["POST", "PUT", "PATCH", "DELETE"];

const normalizeMethod = (method?: string): QueueMethod | null => {
  const upper = (method || "GET").toUpperCase();
  return QUEUEABLE_METHODS.includes(upper as QueueMethod) ? (upper as QueueMethod) : null;
};

const dispatchBrowserEvent = (name: string, detail: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const buildQueuedResult = (path: string, method: QueueMethod, queueId: string): QueuedApiResult => ({
  __queued: true,
  __queueId: queueId,
  __queueMethod: method,
  __queuePath: path,
});

const parseJsonBody = (body: BodyInit | null | undefined): Record<string, unknown> => {
  if (!body) {
    return {};
  }
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { raw: body };
    }
  }
  return {};
};

export async function apiClient<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!appConfig.apiBaseUrl && path.startsWith("/api/")) {
    // Keep same-origin behavior, but provide a clearer path for debugging in production.
    // Some deployments rely on reverse-proxy rewriting /api/* to the Python API.
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[apiClient] NEXT_PUBLIC_API_URL is empty; relying on same-origin /api proxy.");
    }
  }

  // Auto-resolve bearer token from active Supabase session when caller omits it.
  let resolvedToken = token;
  if (!resolvedToken && supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    resolvedToken = sessionData?.session?.access_token ?? undefined;
  }

  // Diagnostic: log token status in development to help trace auth issues.
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[apiClient] TOKEN_STATUS: ${resolvedToken ? "OK" : "NULL"} — ${path}`);
  }

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (resolvedToken) headers.set("Authorization", `Bearer ${resolvedToken}`);

  const method = normalizeMethod(init.method);
  if (typeof navigator !== "undefined" && !navigator.onLine && method && path.startsWith("/api/")) {
    const queueId = crypto.randomUUID();
    const added = useOfflineQueue.getState().addToQueueValidated({
      id: queueId,
      endpoint: path,
      method,
      payload: parseJsonBody(init.body),
      attempts: 0,
      createdAt: Date.now(),
      lastError: "offline",
    });
    if (added) {
      dispatchBrowserEvent("bdcr7:request-queued", { id: queueId, method, path, reason: "offline" });
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[apiClient] Offline queue accepted: ${method} ${path}`);
      }
      return buildQueuedResult(path, method, queueId) as T;
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (method && path.startsWith("/api/")) {
      const queueId = crypto.randomUUID();
      const added = useOfflineQueue.getState().addToQueueValidated({
        id: queueId,
        endpoint: path,
        method,
        payload: parseJsonBody(init.body),
        attempts: 0,
        createdAt: Date.now(),
      });
      if (added) {
        dispatchBrowserEvent("bdcr7:request-queued", { id: queueId, method, path, reason: getErrorMessage(error) });
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(`[apiClient] Request queued for offline sync: ${method} ${path}`);
        }
        return buildQueuedResult(path, method, queueId) as T;
      }
    }
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, response.status));
  }

  if (payload && typeof payload === "object" && "success" in (payload as Record<string, unknown>)) {
    const envelope = payload as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new Error(envelope.error || `Request failed (${response.status})`);
    }
    return envelope.data;
  }

  return payload as T;
}
