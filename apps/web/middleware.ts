import { NextRequest, NextResponse } from "next/server";

import { NON_CORE_DASHBOARD_PREFIXES } from "@/lib/dashboardPolicy";

const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-[^.]+-auth-token(?:\.\d+)?$/;

/**
 * Edge middleware — protects /dashboard/* routes.
 *
 * Supabase stores its session in a cookie whose name follows the pattern:
 *   sb-<project-ref>-auth-token
 * We look for any cookie whose name starts with "sb-" and ends with "-auth-token"
 * to detect an active session without importing the heavy Supabase client here.
 *
 * If no session cookie is found the user is redirected to /login with a
 * `returnTo` search-param so we can deep-link them back after sign-in.
 *
 * Note: Role-based access is NOT enforced here because role lives in the DB
 * (users → roles join), not in the JWT. RBAC is handled by the frontend
 * (AppShell/Sidebar) and by individual API route handlers.
 */

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    if (typeof atob === "function") {
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf8");
    }
    return null;
  } catch {
    return null;
  }
}

function extractAccessToken(rawCookieValue: string): string | null {
  const decodedValue = decodeURIComponent(rawCookieValue);

  const tryAsJsonObject = (candidate: string): string | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object") {
        const token = (parsed as { access_token?: unknown }).access_token;
        if (typeof token === "string" && token.split(".").length === 3) {
          return token;
        }
      }
    } catch {
      // Not JSON.
    }
    return null;
  };

  if (decodedValue.startsWith("base64-")) {
    const unpacked = decodeBase64Url(decodedValue.slice(7));
    if (unpacked) {
      const fromJson = tryAsJsonObject(unpacked);
      if (fromJson) return fromJson;
    }
  }

  const fromJson = tryAsJsonObject(decodedValue);
  if (fromJson) return fromJson;

  const jwtMatch = decodedValue.match(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (jwtMatch) return jwtMatch[0];

  return null;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getSupabaseAuthCookieValue(request: NextRequest): string | null {
  const matchingCookies = request.cookies
    .getAll()
    .filter((cookie) => SUPABASE_AUTH_COOKIE_PATTERN.test(cookie.name));

  if (matchingCookies.length === 0) {
    return null;
  }

  const directCookie = matchingCookies.find((cookie) => cookie.name.endsWith("-auth-token"));
  if (directCookie) {
    return directCookie.value;
  }

  const groupedChunks = new Map<string, Array<{ index: number; value: string }>>();
  for (const cookie of matchingCookies) {
    const match = cookie.name.match(/^(sb-[^.]+-auth-token)\.(\d+)$/);
    if (!match) {
      continue;
    }

    const [, baseName, rawIndex] = match;
    const index = Number.parseInt(rawIndex, 10);
    if (!Number.isFinite(index)) {
      continue;
    }

    const current = groupedChunks.get(baseName) ?? [];
    current.push({ index, value: cookie.value });
    groupedChunks.set(baseName, current);
  }

  const firstChunkGroup = groupedChunks.values().next().value as Array<{ index: number; value: string }> | undefined;
  if (!firstChunkGroup || firstChunkGroup.length === 0) {
    return null;
  }

  return firstChunkGroup
    .sort((left, right) => left.index - right.index)
    .map((chunk) => chunk.value)
    .join("");
}

/**
 * FIX: Extract the refresh_token from the Supabase session cookie.
 *
 * Supabase @supabase/ssr stores a JSON object in sb-*-auth-token that
 * includes both access_token AND refresh_token. When the access_token is
 * expired but refresh_token is still present, the browser-side Supabase
 * client can silently renew the session via refreshSession(). We must NOT
 * redirect to /login in this case — we should let the page load and allow
 * the client Supabase SDK to handle the refresh transparently.
 */
function hasRefreshToken(rawCookieValue: string): boolean {
  const decodedValue = decodeURIComponent(rawCookieValue);

  const tryAsJsonObject = (candidate: string): boolean => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object") {
        const rt = (parsed as { refresh_token?: unknown }).refresh_token;
        return typeof rt === "string" && rt.length > 0;
      }
    } catch {
      // Not JSON.
    }
    return false;
  };

  if (decodedValue.startsWith("base64-")) {
    const unpacked = decodeBase64Url(decodedValue.slice(7));
    if (unpacked && tryAsJsonObject(unpacked)) return true;
  }

  return tryAsJsonObject(decodedValue);
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const authCookieValue = getSupabaseAuthCookieValue(request);

    const accessToken = authCookieValue ? extractAccessToken(authCookieValue) : null;
    const payload = accessToken ? parseJwtPayload(accessToken) : null;
    const exp = typeof payload?.exp === "number" ? payload.exp : null;
    const isExpired = exp ? Date.now() >= exp * 1000 : false;

    if (!accessToken || !payload || isExpired) {
      // FIX: If the access_token is expired but the cookie still contains a
      // valid refresh_token, let the request through. The browser Supabase
      // client calls getSession() → autoRefreshToken on first render, which
      // silently renews the session cookie. Hard-redirecting to /login on
      // expiry while a refresh_token is present caused an infinite loop:
      //   expired cookie → /login → client refreshes → /dashboard →
      //   middleware sees old cookie again → /login → …
      if (isExpired && authCookieValue && hasRefreshToken(authCookieValue)) {
        return NextResponse.next();
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (NON_CORE_DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Note: Role is stored in the `users → roles` DB table, not in the JWT.
    // We cannot reliably enforce RBAC here without a DB round-trip.
    // Frontend RBAC (ROLE_ACCESS in AppShell/Sidebar) handles nav visibility.
    // API routes enforce access at the handler level.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
