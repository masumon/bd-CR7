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
