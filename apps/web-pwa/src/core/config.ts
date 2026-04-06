const toNumber = (raw: string | undefined, fallback: number) => {
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

export const appConfig = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_URL || "").trim(),
  geofence: {
    siteLat: toNumber(process.env.NEXT_PUBLIC_SITE_LAT, 23.777176),
    siteLng: toNumber(process.env.NEXT_PUBLIC_SITE_LNG, 90.399452),
    maxRadiusKm: toNumber(process.env.NEXT_PUBLIC_SITE_MAX_RADIUS_KM, 2.0),
  },
} as const;

/**
 * Matches any URL that points to the local machine (unreachable from the internet).
 * Used by both the server-side API proxy and the browser API client to detect
 * accidental deployment of localhost-only API URLs to production.
 */
export const LOCALHOST_URL_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/;

/**
 * True when the code is running in a real production deployment.
 *
 * Logic (used by the browser API client; server-side code in route handlers
 * additionally checks APP_ENV which is unavailable in browser bundles):
 *   1. NEXT_PUBLIC_VERCEL_ENV — set by the Vercel platform; "preview" is NOT
 *      production even though NODE_ENV is also "production" on preview builds.
 *   2. NODE_ENV — standard Node.js / Next.js fallback for non-Vercel hosts.
 *
 * Note: APP_ENV (server-side only, no NEXT_PUBLIC_ prefix) cannot be read in
 * browser bundles, so it is intentionally omitted here. The server-side proxy
 * route (app/api/[...path]/route.ts) checks it separately.
 *
 * NEXT_PUBLIC_ prefix makes this available to browser (client) bundles.
 */
export const IS_PRODUCTION: boolean = process.env.NEXT_PUBLIC_VERCEL_ENV
  ? process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";
