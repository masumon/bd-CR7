import { NextResponse } from "next/server";

export function GET(request: Request) {
  // Ensure favicon requests are always served by redirecting to an existing static icon.
  return NextResponse.redirect(new URL("/icons/icon.svg", request.url), 307);
}
