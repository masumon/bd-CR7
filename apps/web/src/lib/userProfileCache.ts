import { apiClient } from "@/lib/apiClient";

const PROFILE_CACHE_TTL_MS = 60_000;

export type CachedUserProfile = {
  full_name?: string;
  email?: string;
  phone?: string | null;
  user_code?: string | null;
  profile_image_url?: string | null;
};

type ProfileCacheEntry = {
  data: CachedUserProfile;
  cachedAt: number;
};

const profileCache = new Map<string, ProfileCacheEntry>();
const profileRequests = new Map<string, Promise<CachedUserProfile>>();

function getProfileCacheKey(token: string): string {
  return token.slice(0, 16);
}

export async function getMyProfileCached(token: string, options: { force?: boolean } = {}): Promise<CachedUserProfile> {
  const cacheKey = getProfileCacheKey(token);
  const cached = profileCache.get(cacheKey);
  if (!options.force && cached && Date.now() - cached.cachedAt < PROFILE_CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = profileRequests.get(cacheKey);
  if (!options.force && inFlight) {
    return inFlight;
  }

  const request = apiClient<CachedUserProfile>("/api/users/me/profile", { method: "GET" }, token);
  profileRequests.set(cacheKey, request);

  try {
    const result = await request;
    profileCache.set(cacheKey, { data: result, cachedAt: Date.now() });
    return result;
  } finally {
    profileRequests.delete(cacheKey);
  }
}

export function primeMyProfileCache(token: string, profile: CachedUserProfile): void {
  profileCache.set(getProfileCacheKey(token), {
    data: profile,
    cachedAt: Date.now(),
  });
}

export function mergeMyProfileCache(token: string, partial: Partial<CachedUserProfile>): void {
  const cacheKey = getProfileCacheKey(token);
  const existing = profileCache.get(cacheKey);
  profileCache.set(cacheKey, {
    data: {
      ...(existing?.data || {}),
      ...partial,
    },
    cachedAt: Date.now(),
  });
}