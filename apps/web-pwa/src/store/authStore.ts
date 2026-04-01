import { create } from "zustand";
import { persist } from "zustand/middleware";

import { supabase } from "@/lib/supabase";

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
        if (!supabase) {
          throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session || !data.user) {
          throw new Error(error?.message || "Login failed");
        }

        let roleName = "viewer";
        const { data: localUser } = await supabase
          .from("users")
          .select("role_id")
          .eq("id", data.user.id)
          .maybeSingle();
        if (localUser?.role_id) {
          const { data: roleRow } = await supabase
            .from("roles")
            .select("name")
            .eq("id", localUser.role_id)
            .maybeSingle();
          roleName = roleRow?.name || roleName;
        }

        set({ token: data.session.access_token, role: roleName, userId: data.user.id });
      },
      register: async (email, password, fullName, roleName) => {
        if (!supabase) {
          throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role_name: roleName || "viewer" },
          },
        });
        if (error || !data.user) {
          throw new Error(error?.message || "Registration failed");
        }

        const accessToken = data.session?.access_token || null;
        set({ token: accessToken, role: roleName || "viewer", userId: data.user.id });
      },
      logout: () => {
        void supabase?.auth.signOut();
        set({ token: null, role: null, userId: null });
      },
    }),
    { name: "bdcr7-auth" }
  )
);
