import { appConfig } from "@/core/config";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string | null;
};

const buildUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return appConfig.apiBaseUrl ? `${appConfig.apiBaseUrl}${path}` : path;
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

export async function apiClient<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!appConfig.apiBaseUrl && path.startsWith("/api/")) {
    // Keep same-origin behavior, but provide a clearer path for debugging in production.
    // Some deployments rely on reverse-proxy rewriting /api/* to the Python API.
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[apiClient] NEXT_PUBLIC_API_URL is empty; relying on same-origin /api proxy.");
    }
  }

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

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
