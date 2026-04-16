import { appConfig, IS_PRODUCTION, LOCALHOST_URL_PATTERN } from "@/core/config";
import { getAccessToken, refreshAccessToken, SESSION_EXPIRED_MESSAGE } from "@/lib/authSession";
import { getErrorMessage } from "@/lib/errorUtils";
import { detectActualOffline, emitNetworkStatus, isNetworkFailure } from "@/lib/networkReachability";
import useOfflineQueue, { type QueueMethod } from "@/store/offlineQueue";
import { useAuthStore } from "@/store/authStore";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string | null;
};

export class ApiRequestError extends Error {
  status?: number;
  code: "auth" | "permission" | "server" | "network" | "offline" | "request";

  constructor(message: string, code: ApiRequestError["code"], status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

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

const isAuthRoute = (path: string) => path.startsWith("/api/auth/");

const createApiError = (status: number, payload: unknown) => {
  if (status === 401) {
    return new ApiRequestError(SESSION_EXPIRED_MESSAGE, "auth", status);
  }

  if (status === 403) {
    return new ApiRequestError("You do not have permission to perform this action.", "permission", status);
  }

  if (status >= 500) {
    return new ApiRequestError(toErrorMessage(payload, status), "server", status);
  }

  return new ApiRequestError(toErrorMessage(payload, status), "request", status);
};

type InternalRequestInit = RequestInit & {
  __bdcr7RetriedAuth?: boolean;
};

export async function apiClient<T>(path: string, init: InternalRequestInit = {}, token?: string): Promise<T> {
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
  if (!resolvedToken) {
    resolvedToken = (await getAccessToken()) ?? undefined;
  }

  // Diagnostic: log token status in development to help trace auth issues.
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[apiClient] TOKEN_STATUS: ${resolvedToken ? "OK" : "NULL"} — ${path}`);
  }

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (resolvedToken) headers.set("Authorization", `Bearer ${resolvedToken}`);

  const method = normalizeMethod(init.method);
  if (typeof navigator !== "undefined" && method && path.startsWith("/api/") && !isAuthRoute(path) && !navigator.onLine) {
    const isOffline = await detectActualOffline();
    if (!isOffline) {
      emitNetworkStatus({ online: true, source: "offline-hint-cleared" });
    }

    if (isOffline) {
      emitNetworkStatus({ online: false, source: "offline-precheck" });
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
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
    emitNetworkStatus({ online: true, source: "api-success" });
  } catch (error) {
    const offline = await detectActualOffline(error);
    if (offline) {
      emitNetworkStatus({ online: false, source: "api-failure", reason: getErrorMessage(error) });
    } else {
      emitNetworkStatus({ online: true, source: "api-failure-server" });
    }

    if (offline && method && path.startsWith("/api/") && !isAuthRoute(path)) {
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
        dispatchBrowserEvent("bdcr7:request-queued", { id: queueId, method, path, reason: getErrorMessage(error) });
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(`[apiClient] Request queued for offline sync: ${method} ${path}`);
        }
        return buildQueuedResult(path, method, queueId) as T;
      }
      throw new ApiRequestError("You appear to be offline. The request was queued for retry.", "offline");
    }

    if (isNetworkFailure(error)) {
      throw new ApiRequestError("Network error while contacting the API.", offline ? "offline" : "network");
    }

    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (response.status === 401 && !init.__bdcr7RetriedAuth && !isAuthRoute(path)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiClient<T>(
        path,
        {
          ...init,
          __bdcr7RetriedAuth: true,
        },
        refreshedToken,
      );
    }

    emitNetworkStatus({ online: true, source: "auth-expired" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bdcr7:auth-expired", { detail: { path } }));
    }
    useAuthStore.getState().logout();
    throw createApiError(response.status, payload);
  }

  if (!response.ok) {
    throw createApiError(response.status, payload);
  }

  if (payload && typeof payload === "object" && "success" in (payload as Record<string, unknown>)) {
    const envelope = payload as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new ApiRequestError(envelope.error || `Request failed (${response.status})`, "request", response.status);
    }
    return envelope.data;
  }

  return payload as T;
}
