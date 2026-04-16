import type { Session } from "@supabase/supabase-js";

import { getErrorMessage } from "@/lib/errorUtils";
import { supabase } from "@/lib/supabase";

export const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again.";

type AuthMeResponse = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
};

function normalizeRole(role: string | null | undefined): string | null {
  if (!role || !role.trim()) {
    return null;
  }

  return role.trim().toLowerCase();
}

async function fetchSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || "Failed to load session");
  }

  return data.session;
}

export async function refreshSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(error.message || "Failed to refresh session");
  }

  return data.session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await fetchSession();
  return session?.access_token ?? null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const session = await refreshSession();
  return session?.access_token ?? null;
}

export async function getSessionWithFallback(): Promise<Session | null> {
  const session = await fetchSession();
  if (session) {
    return session;
  }

  return refreshSession();
}

export async function validateSessionWithMe(accessToken: string): Promise<AuthMeResponse | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body.trim() || `Failed to validate session (${response.status})`);
  }

  const payload = (await response.json()) as AuthMeResponse;
  return {
    ...payload,
    role: normalizeRole(payload.role),
  };
}

export async function resolveValidatedSession(): Promise<{
  session: Session;
  profile: AuthMeResponse | null;
}> {
  let session = await getSessionWithFallback();
  if (!session) {
    return { session: null as never, profile: null };
  }

  let profile = await validateSessionWithMe(session.access_token);
  if (profile) {
    return { session, profile };
  }

  session = await refreshSession();
  if (!session) {
    return { session: null as never, profile: null };
  }

  profile = await validateSessionWithMe(session.access_token);
  if (!profile) {
    return { session: null as never, profile: null };
  }

  return { session, profile };
}

export async function signOutSession(): Promise<void> {
  try {
    await supabase?.auth.signOut();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] Failed to sign out cleanly:", getErrorMessage(error));
    }
  }
}