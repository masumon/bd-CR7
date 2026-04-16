import { apiClient } from "@/lib/apiClient";

const SECURITY_SETTINGS_TTL_MS = 60_000;

type CachedSecuritySettings = {
  data: SecuritySettings;
  cachedAt: number;
};

const securitySettingsCache = new Map<string, CachedSecuritySettings>();
const securitySettingsRequests = new Map<string, Promise<SecuritySettings>>();

function normalizeEmailHint(email?: string): string {
  return email?.trim().toLowerCase() || "";
}

function getSecurityCacheKey(options: { token?: string; email?: string }): string | null {
  if (options.token) {
    return `token:${options.token.slice(0, 16)}`;
  }

  const email = normalizeEmailHint(options.email);
  return email ? `email:${email}` : null;
}

export type SecuritySettings = {
  biometric_enabled: boolean;
  pin_enabled: boolean;
  pin_configured: boolean;
  pin_failed_attempts: number;
  pin_locked_until: string | null;
  trusted_device_label: string | null;
  current_device_trusted: boolean;
  credential_count: number;
  can_register_biometric: boolean;
  has_biometric_credentials: boolean;
  email_hint: string | null;
};

export type MagicLinkBootstrap = {
  token_hash: string;
  email: string;
  type: "magiclink";
  role?: string | null;
  user_id?: string | null;
};

export async function fetchSecuritySettings(options: { token?: string; email?: string } = {}) {
  const normalizedEmail = normalizeEmailHint(options.email);
  const cacheKey = getSecurityCacheKey({ token: options.token, email: normalizedEmail });
  const now = Date.now();

  if (cacheKey) {
    const cached = securitySettingsCache.get(cacheKey);
    if (cached && now - cached.cachedAt < SECURITY_SETTINGS_TTL_MS) {
      return cached.data;
    }

    const inFlight = securitySettingsRequests.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
  }

  const search = normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : "";
  const request = apiClient<SecuritySettings>(`/api/auth/security-settings${search}`, { method: "GET" }, options.token);

  if (cacheKey) {
    securitySettingsRequests.set(cacheKey, request);
  }

  try {
    const result = await request;
    if (cacheKey) {
      securitySettingsCache.set(cacheKey, { data: result, cachedAt: now });
    }
    return result;
  } finally {
    if (cacheKey) {
      securitySettingsRequests.delete(cacheKey);
    }
  }
}

export async function updateSecuritySettings(token: string, patch: { biometric_enabled?: boolean; pin_enabled?: boolean }) {
  const result = await apiClient<SecuritySettings>("/api/auth/security-settings", { method: "PATCH", body: JSON.stringify(patch) }, token);
  securitySettingsCache.set(`token:${token.slice(0, 16)}`, { data: result, cachedAt: Date.now() });
  return result;
}

export async function setLoginPin(token: string, pin: string, confirmPin: string) {
  const result = await apiClient<SecuritySettings>("/api/auth/pin/set", { method: "POST", body: JSON.stringify({ pin, confirm_pin: confirmPin }) }, token);
  securitySettingsCache.set(`token:${token.slice(0, 16)}`, { data: result, cachedAt: Date.now() });
  return result;
}

export async function verifyPinLogin(email: string, pin: string) {
  return apiClient<MagicLinkBootstrap>("/api/auth/pin/verify", { method: "POST", body: JSON.stringify({ email, pin }) });
}