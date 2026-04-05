import { NextRequest, NextResponse } from "next/server";

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
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const hasSession = request.cookies.getAll().some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"),
    );

    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
