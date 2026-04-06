/**
 * API Proxy Route
 *
 * All /api/* requests from the frontend are forwarded to the Python backend
 * (SUMONIX AI / FastAPI) identified by the PYTHON_API_URL server-side env var.
 *
 * PYTHON_API_URL is a server-only env var (not NEXT_PUBLIC_) so the backend
 * URL is never exposed to browsers.  The frontend always calls same-origin
 * /api/* paths; this handler performs the actual forwarding.
 *
 * When PYTHON_API_URL is not configured the handler returns a structured JSON
 * error (503) instead of an HTML error page, so the frontend apiClient can
 * always parse the response.
 *
 * Environment variables:
 *   PYTHON_API_URL  — URL of the Python FastAPI service, e.g.
 *                     http://localhost:8000   (development)
 *                     https://api.example.com (production)
 *
 * Backward-compat fallback: if PYTHON_API_URL is not set, the handler tries
 * NEXT_PUBLIC_API_URL (existing env var used in previous deployments).
 */

import { type NextRequest, NextResponse } from "next/server";
import { LOCALHOST_URL_PATTERN } from "@/core/config";

// NEXT_PUBLIC_API_URL kept as a backward-compat fallback so existing
// deployments that already have it set keep working automatically.
// In production, ignore localhost/127.0.0.1 values from NEXT_PUBLIC_API_URL
// because the browser cannot reach those addresses from the internet.
const rawApiUrl = (
  process.env.PYTHON_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

// Detect production environment using whichever variable is available:
//   VERCEL_ENV  — set automatically by the Vercel platform ("production" | "preview" | "development")
//               — takes precedence; "preview" must not be treated as production.
//   APP_ENV     — set manually for non-Vercel deployments (e.g. Railway, Fly.io)
//               — server-side only, not available in browser bundles (no NEXT_PUBLIC_ prefix).
//   NODE_ENV    — standard Node.js fallback ("production" in compiled/bundled builds)
// When VERCEL_ENV is present we rely on it exclusively so that Vercel preview
// deployments (where NODE_ENV is also "production") are NOT treated as production.
// APP_ENV is checked here (server-side route handler) but not in IS_PRODUCTION
// (config.ts) because it is a server-side-only variable unavailable in the browser.
const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : (process.env.APP_ENV || process.env.NODE_ENV) === "production";

// If the resolved API URL points to localhost and we're in production, it can
// never be reached from the internet — discard it so the proxy returns a clear
// 503 rather than an unreachable-host error. This applies regardless of which
// env var (PYTHON_API_URL or NEXT_PUBLIC_API_URL) provided the localhost value.
const PYTHON_API =
  isProduction && LOCALHOST_URL_PATTERN.test(rawApiUrl) ? "" : rawApiUrl;

// Proxy request timeout in milliseconds.
// Default is conservative (9s) to stay within Vercel Hobby's 10s limit.
// Override via PROXY_TIMEOUT_MS env var for Pro/Enterprise plans where longer
// AI/DB queries may require more time (e.g. set to 30000 on Vercel Pro).
const parsedTimeout = Number(process.env.PROXY_TIMEOUT_MS);
const PROXY_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 9_000;
const PROXY_TIMEOUT_SECONDS = PROXY_TIMEOUT_MS / 1000;

/** Returns a 503 JSON response indicating the backend API is not configured. */
const createNotConfiguredResponse = () =>
  NextResponse.json(
    {
      success: false,
      data: null,
      error:
        "Backend API not configured. Set PYTHON_API_URL (server-side, recommended) or NEXT_PUBLIC_API_URL (legacy fallback) to the URL of the Python API service.",
    },
    { status: 503 },
  );

/** Returns a 508 JSON response when the proxy target resolves to itself. */
const createLoopDetectedResponse = (targetUrl: string) =>
  NextResponse.json(
    {
      success: false,
      data: null,
      error: `Proxy loop detected: PYTHON_API_URL (${PYTHON_API}) points back to this Next.js application. Set PYTHON_API_URL to the actual Python FastAPI backend URL (e.g. https://bd-cr7-api.onrender.com). Target was: ${targetUrl}`,
    },
    { status: 508 },
  );

/**
 * Forward an incoming Next.js request to the Python backend.
 * Always returns an application/json response.
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!PYTHON_API) return createNotConfiguredResponse();

  const targetPath = "/api/" + pathSegments.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${PYTHON_API}${targetPath}${search}`;

  // Guard against proxy loops: if PYTHON_API points to the same host as the
  // current request, forwarding would call this handler again recursively,
  // resulting in a 508 Loop Detected error. Catch it early and return a
  // descriptive 508 immediately.
  const requestOrigin = request.nextUrl.origin;
  if (PYTHON_API.startsWith(requestOrigin)) {
    return createLoopDetectedResponse(targetUrl);
  }

  // Forward only the headers the backend cares about.
  const forwardHeaders = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) forwardHeaders.set("authorization", auth);
  const ct = request.headers.get("content-type");
  if (ct) forwardHeaders.set("content-type", ct);
  // Always request JSON from the backend.
  forwardHeaders.set("accept", "application/json");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let body: string | undefined;
  if (hasBody) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  // Abort the upstream request if it exceeds PROXY_TIMEOUT_MS to prevent
  // hanging serverless functions (which cause 504/508 errors on Vercel).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      // Disable Next.js extended-fetch cache so proxy responses are always fresh.
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    // DOMException with name 'AbortError' is thrown when AbortController fires.
    // Check both the constructor name and the .name property for compatibility
    // across Node.js versions and runtimes (Node ≥18, Edge, etc.).
    const isTimeout =
      (fetchError instanceof DOMException && fetchError.name === "AbortError") ||
      (fetchError instanceof Error && fetchError.name === "AbortError");
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: isTimeout
          ? `Backend request timed out after ${PROXY_TIMEOUT_SECONDS}s. The Python API at ${PYTHON_API} is not responding.`
          : `Backend unreachable at ${PYTHON_API}. Check PYTHON_API_URL. (${(fetchError as Error).message})`,
      },
      { status: isTimeout ? 504 : 503 },
    );
  }
  clearTimeout(timeoutId);

  // Read the upstream response body as text first (handles non-JSON too).
  const rawBody = await upstream.text();
  const upstreamContentType = upstream.headers.get("content-type") ?? "";

  // If upstream already returned JSON, stream it through unchanged.
  if (upstreamContentType.includes("application/json")) {
    return new NextResponse(rawBody, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  }

  // If upstream returned HTML or plain text (error pages), wrap in JSON so
  // the browser never receives an unexpected content-type.
  try {
    const parsed: unknown = JSON.parse(rawBody);
    return NextResponse.json(parsed, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Backend returned non-JSON response (HTTP ${upstream.status}).`,
      },
      {
        status: upstream.status >= 400 ? upstream.status : 502,
      },
    );
  }
}

// Next.js 15 App Router: params is a Promise.
type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}
