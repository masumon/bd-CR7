import { apiClient } from "@/lib/apiClient";

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (path.startsWith("/api/ai-employ")) {
    throw new Error("SUMONIX automation endpoints are disabled. Use chatbot features instead.");
  }
  return apiClient<T>(path, init, token);
}
