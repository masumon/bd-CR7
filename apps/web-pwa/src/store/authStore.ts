import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiRequest } from "@/lib/api";

type AuthState = {
  token: string | null;
  role: string | null;
  userId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, roleName: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      login: async (email, password) => {
        const result = await apiRequest<{ access_token: string; role: string; user_id: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        set({ token: result.access_token, role: result.role, userId: result.user_id });
      },
      register: async (email, password, fullName, roleName) => {
        const result = await apiRequest<{ access_token: string; role: string; user_id: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, full_name: fullName, role_name: roleName }),
        });
        set({ token: result.access_token, role: result.role, userId: result.user_id });
      },
      logout: () => set({ token: null, role: null, userId: null }),
    }),
    { name: "bdcr7-auth" }
  )
);
