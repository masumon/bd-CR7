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
 * Logic (same algorithm used in both the server-side proxy route and the
 * browser API client so behaviour is consistent):
 *   1. NEXT_PUBLIC_VERCEL_ENV — set by the Vercel platform; "preview" is NOT
 *      production even though NODE_ENV is also "production" on preview builds.
 *   2. NODE_ENV — standard Node.js / Next.js fallback for non-Vercel hosts.
 *
 * NEXT_PUBLIC_ prefix makes this available to browser (client) bundles.
 * In the server-side proxy VERCEL_ENV (non-public) is checked first for the
 * same distinction; this export covers the browser-side use case.
 */
export const IS_PRODUCTION: boolean = process.env.NEXT_PUBLIC_VERCEL_ENV
  ? process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";
