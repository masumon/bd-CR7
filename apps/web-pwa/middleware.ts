import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next();
    }

    let response = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({ request });
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (NON_CORE_DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const roleFromClaims = normalizeRoleName(
      (session.user.app_metadata?.role as string | undefined) ||
        (session.user.user_metadata?.role_name as string | undefined) ||
        null,
    );

    const allowed = ROLE_ACCESS[roleFromClaims] ?? ROLE_ACCESS.viewer;
    if (!isPathAllowed(pathname, allowed)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
