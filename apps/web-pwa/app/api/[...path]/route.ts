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

// NEXT_PUBLIC_API_URL kept as a backward-compat fallback so existing
// deployments that already have it set keep working automatically.
const PYTHON_API = (
  process.env.PYTHON_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

const NOT_CONFIGURED = NextResponse.json(
  {
    success: false,
    data: null,
    error:
      "Backend API not configured. Set the PYTHON_API_URL environment variable on the server to the URL of the Python API service.",
  },
  { status: 503 },
);

/**
 * Forward an incoming Next.js request to the Python backend.
 * Always returns an application/json response.
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!PYTHON_API) return NOT_CONFIGURED;

  const targetPath = "/api/" + pathSegments.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${PYTHON_API}${targetPath}${search}`;

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

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      // Disable Next.js extended-fetch cache so proxy responses are always fresh.
      cache: "no-store",
    });
  } catch (fetchError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Backend unreachable at ${PYTHON_API}. Check PYTHON_API_URL. (${(fetchError as Error).message})`,
      },
      { status: 503 },
    );
  }

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
