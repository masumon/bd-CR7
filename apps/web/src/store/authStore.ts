import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, Subscription } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import useOfflineQueue from "@/store/offlineQueue";
import { getErrorMessage } from "@/lib/errorUtils";

const VALID_ROLES = new Set([
  "super_admin", "admin", "checker", "maker",
  "supervisor", "engineer", "manager", "accountant", "mason", "worker", "viewer",
]);

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

  // Profile missing: auto-create from auth session metadata.
  // Covers Google OAuth first-login and email-confirmed users where the DB
  // trigger may not have run (e.g. accounts created before the migration).
  if (!data) {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (!authUser?.email) {
      throw new Error("User profile missing. Please contact your administrator.");
    }
    const fullName =
      (authUser.user_metadata?.full_name as string | undefined) ||
      authUser.email.split("@")[0];
    const roleMeta = (authUser.user_metadata?.role_name as string | undefined) || "viewer";
    const role = VALID_ROLES.has(roleMeta) ? roleMeta : "viewer";

    // Insert with RLS: users_self_insert policy allows auth.uid() = id.
    const { error: insertError } = await supabase.from("users").insert({
      id: authUser.id,
      email: authUser.email,
      auth_email: authUser.email,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (insertError) {
      // Insert failed (RLS or conflict). Try reading again — the row may
      // have been created by the DB trigger concurrently.
      const { data: retry } = await supabase
        .from("users")
        .select("role,is_active")
        .eq("id", authUser.id)
        .maybeSingle();
      if (retry) {
        if (retry.is_active === false) throw new Error("User account is inactive.");
        const retryRole = (retry as { role?: string }).role;
        if (typeof retryRole === "string" && retryRole.trim()) return retryRole.trim().toLowerCase();
      }
      throw new Error("User profile missing. Please contact your administrator.");
    }

    return role;
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

type AuthStateSetter = (partial: Partial<AuthState>) => void;

let authSubscription: Subscription | null = null;

async function applySessionToState(session: Session | null, setState: AuthStateSetter): Promise<void> {
  if (!session?.user?.id) {
    setState({ token: null, userId: null, role: null, loading: false, hydrated: true, error: null });
    return;
  }

  let roleName: string | null = null;
  let roleError: string | null = null;
  try {
    roleName = await fetchUserRole(session.user.id);
  } catch (roleErr) {
    roleError = getErrorMessage(roleErr);
  }

  setState({
    token: session.access_token,
    userId: session.user.id,
    role: roleName,
    loading: false,
    hydrated: true,
    error: roleError,
  });
}

function ensureAuthSubscription() {
  if (!supabase || authSubscription) {
    return;
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // INITIAL_SESSION: handled explicitly by initialize() via getSession().
    //   Letting it through races with the loading: true set in initialize() and
    //   can write userId: null before the real session is confirmed — triggering
    //   a spurious redirect to /login.
    // SIGNED_IN: handled by login() / register() / OAuth callback directly.
    //   Allowing it here causes a duplicate fetchUserRole() DB call that can
    //   overwrite state written by those explicit auth calls.
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") return;

    void applySessionToState(session, (partial) => {
      useAuthStore.setState(partial);
      if (!session?.user?.id) {
        useOfflineQueue.getState().clearQueue();
      }
    });
  });

  authSubscription = data.subscription;
}

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
        ensureAuthSubscription();

        // If we already have a live, hydrated session in memory (e.g. user just
        // signed in and was navigated to the dashboard), do NOT reset the loading
        // state — that would cause a brief null-user window that triggers the
        // redirect-to-login guard in MobileAppShell.  Instead, validate the
        // session silently in the background.
        const { hydrated: alreadyHydrated, userId: currentUserId } =
          useAuthStore.getState();
        if (alreadyHydrated && currentUserId !== null && currentUserId !== undefined) {
          // Capture the non-null client for use inside the async callback.
          const client = supabase;
          void client.auth
            .getSession()
            .then(async ({ data }) => {
              if (!data.session) {
                // Access token gone — try refreshing before giving up.
                const { data: refreshed } = await client.auth.refreshSession();
                if (!refreshed.session) {
                  set({
                    token: null,
                    userId: null,
                    role: null,
                    loading: false,
                    hydrated: true,
                    error: null,
                  });
                }
              }
            })
            .catch((err: unknown) => {
              // Network error during background validation — keep existing state
              // so the user is not incorrectly signed out due to a transient failure.
              if (process.env.NODE_ENV !== "production") {
                console.warn("[auth] Background session validation failed:", err);
              }
            });
          return;
        }

        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw new Error(error.message || "Failed to restore session");
          }
          let session = data.session;
          // If no session was returned but a refresh token may still be valid,
          // attempt a silent refresh before clearing auth state.
          if (!session) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            session = refreshed.session;
          }
          await applySessionToState(session, set);
        } catch (err) {
          // Only the supabase.auth.getSession() call itself failed here.
          // It is safe to clear auth state in this case.
          set({
            token: null,
            role: null,
            userId: null,
            loading: false,
            hydrated: true,
            error: getErrorMessage(err),
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
          set({ loading: false, hydrated: true, error: getErrorMessage(err) });
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
          set({ loading: false, error: getErrorMessage(err) });
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
