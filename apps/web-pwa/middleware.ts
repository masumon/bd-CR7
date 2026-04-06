import { NextRequest, NextResponse } from "next/server";

import { NON_CORE_DASHBOARD_PREFIXES } from "@/lib/dashboardPolicy";
import { ROLE_ACCESS, normalizeRoleName } from "@/lib/rbac";

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
 */
function isPathAllowed(pathname: string, allowed: string[]): boolean {
  return allowed.some((base) => {
    if (base === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === base || pathname.startsWith(`${base}/`);
  });
}

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

function resolveRoleFromPayload(payload: Record<string, unknown> | null): string {
  if (!payload) return normalizeRoleName(null);

  const appMeta = payload.app_metadata as Record<string, unknown> | undefined;
  const userMeta = payload.user_metadata as Record<string, unknown> | undefined;

  return normalizeRoleName(
    (typeof appMeta?.role === "string" ? appMeta.role : null) ||
      (typeof appMeta?.role_name === "string" ? appMeta.role_name : null) ||
      (typeof userMeta?.role === "string" ? userMeta.role : null) ||
      (typeof userMeta?.role_name === "string" ? userMeta.role_name : null) ||
      null,
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const authCookie = request.cookies
      .getAll()
      .find((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

    const accessToken = authCookie ? extractAccessToken(authCookie.value) : null;
    const payload = accessToken ? parseJwtPayload(accessToken) : null;
    const exp = typeof payload?.exp === "number" ? payload.exp : null;
    const isExpired = exp ? Date.now() >= exp * 1000 : false;

    if (!accessToken || !payload || isExpired) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (NON_CORE_DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const roleFromClaims = resolveRoleFromPayload(payload);

    const allowed = ROLE_ACCESS[roleFromClaims] ?? ROLE_ACCESS.viewer;
    if (!isPathAllowed(pathname, allowed)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
