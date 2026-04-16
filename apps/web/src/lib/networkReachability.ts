const REACHABILITY_PATH = "/api";
const REACHABILITY_TIMEOUT_MS = 4000;

export type NetworkStatusDetail = {
  online: boolean;
  source: string;
  reason?: string;
};

export function emitNetworkStatus(detail: NetworkStatusDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("bdcr7:network-status", { detail }));
}

export function isNetworkFailure(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed") ||
      message.includes("load failed") ||
      message.includes("fetch")
    );
  }

  return false;
}

export async function probeNetworkReachability(): Promise<boolean> {
  if (typeof window === "undefined") {
    return true;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);

  try {
    const response = await fetch(REACHABILITY_PATH, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "x-bdcr7-reachability": "1",
      },
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function detectActualOffline(error?: unknown): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const browserSaysOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (!browserSaysOffline && error && !isNetworkFailure(error)) {
    return false;
  }

  const reachable = await probeNetworkReachability();
  return !reachable;
}