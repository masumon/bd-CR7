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
