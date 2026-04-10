import { create } from "zustand";
import { persist } from "zustand/middleware";

import { supabase } from "@/lib/supabase";
import useOfflineQueue from "@/store/offlineQueue";

async function fetchUserRole(userId: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const { data, error } = await supabase
    .from("users")
    .select("id,is_active,role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load user profile");
  }
  if (!data) {
    throw new Error("User profile missing. Please contact your administrator.");
  }
  if (data.is_active === false) {
    throw new Error("User account is inactive.");
  }

  const role = (data as { role?: string }).role;
  if (typeof role === "string" && role.trim()) return role.trim().toLowerCase();
  throw new Error("User role mapping is missing. Contact administrator.");
}


function normalizeAuthError(message: string | undefined, mode: "login" | "register"): string {
  const text = (message || "").toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "No matching Supabase Auth user was found for this email/password. Use Create account first or reset the password.";
  }

  if (text.includes("email not confirmed")) {
    return "This account exists but the email is not confirmed yet. Confirm the email from your inbox, then login again.";
  }

  if (text.includes("user already registered")) {
    return "This email is already registered. Use Sign in or reset the password.";
  }

  if (mode === "register" && text.includes("password should be at least")) {
    return message || "Password is too weak.";
  }

  return message || (mode === "login" ? "Login failed" : "Registration failed");
}

type AuthState = {
  token: string | null;
  role: string | null;
  userId: string | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  fetchUser: () => Promise<void>;
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
      loading: false,
      hydrated: false,
      error: null,
      initialize: async () => {
        if (!supabase) {
          set({ hydrated: true, loading: false });
          return;
        }
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw new Error(error.message || "Failed to restore session");
          }
          const session = data.session;

          if (session?.user?.id) {
            const roleName = await fetchUserRole(session.user.id);
            set({
              token: session.access_token,
              userId: session.user.id,
              role: roleName,
              loading: false,
              hydrated: true,
              error: null,
            });
            return;
          }

          set({ token: null, userId: null, role: null, loading: false, hydrated: true });
        } catch (err) {
          set({
            token: null,
            role: null,
            userId: null,
            loading: false,
            hydrated: true,
            error: (err as Error).message,
          });
        }
      },
      fetchUser: async () => {
        const state = useAuthStore.getState();
        if (!state.userId) {
          return;
        }
        set({ loading: true, error: null });
        try {
          const roleName = await fetchUserRole(state.userId);
          set({ role: roleName, loading: false, hydrated: true });
        } catch (err) {
          set({ loading: false, hydrated: true, error: (err as Error).message });
          throw err;
        }
      },
      login: async (email, password) => {
        if (!supabase) {
          throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        }
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session || !data.user) {
          set({ loading: false });
          throw new Error(normalizeAuthError(error?.message, "login"));
        }
        try {
          const roleName = await fetchUserRole(data.user.id);
          set({ token: data.session.access_token, role: roleName, userId: data.user.id, loading: false, hydrated: true });
        } catch (err) {
          set({ loading: false, error: (err as Error).message });
          throw err;
        }
      },
      register: async (email, password, fullName, roleName) => {
        if (!supabase) {
          throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        }
        set({ loading: true, error: null });
        const origin = typeof window !== "undefined" ? window.location.origin : "https://bd-cr7.vercel.app";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role_name: roleName || "viewer" },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
        if (error || !data.user) {
          set({ loading: false });
          throw new Error(normalizeAuthError(error?.message, "register"));
        }

        const accessToken = data.session?.access_token || null;
        if (accessToken) {
          try {
            const resolvedRole = await fetchUserRole(data.user.id);
            set({ token: accessToken, role: resolvedRole, userId: data.user.id, loading: false, hydrated: true });
            return;
          } catch {
            // Keep successful auth state while backend profile propagation catches up.
          }
        }
        set({ token: accessToken, role: null, userId: data.user.id, loading: false, hydrated: true });
      },
      logout: () => {
        void supabase?.auth.signOut();
        // Clear persisted offline queue so a subsequent user on the same device
        // cannot view or replay the previous user's queued financial operations.
        useOfflineQueue.getState().clearQueue();
        set({ token: null, role: null, userId: null, loading: false, hydrated: true, error: null });
      },
    }),
    {
      name: "bdcr7-auth",
      version: 2,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }
        const stateContainer = persistedState as { state?: Record<string, unknown> };
        if (!stateContainer.state || typeof stateContainer.state !== "object") {
          return persistedState;
        }
        const nextState = { ...stateContainer.state };
        delete nextState.token;
        return {
          ...stateContainer,
          state: nextState,
        };
      },
      partialize: (state) => ({
        role: state.role,
        userId: state.userId,
      }),
    }
  )
);
