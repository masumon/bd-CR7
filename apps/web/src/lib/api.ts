import { apiClient } from "@/lib/apiClient";

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  return apiClient<T>(path, init, token);
}
