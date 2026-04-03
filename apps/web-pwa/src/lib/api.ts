const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").trim();

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestUrl = API_BASE
    ? `${API_BASE}${path}`
    : path;

  const response = await fetch(requestUrl, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
