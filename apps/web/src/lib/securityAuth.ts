import { apiClient } from "@/lib/apiClient";

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
  const search = options.email ? `?email=${encodeURIComponent(options.email.trim().toLowerCase())}` : "";
  return apiClient<SecuritySettings>(`/api/auth/security-settings${search}`, { method: "GET" }, options.token);
}

export async function updateSecuritySettings(token: string, patch: { biometric_enabled?: boolean; pin_enabled?: boolean }) {
  return apiClient<SecuritySettings>("/api/auth/security-settings", { method: "PATCH", body: JSON.stringify(patch) }, token);
}

export async function setLoginPin(token: string, pin: string, confirmPin: string) {
  return apiClient<SecuritySettings>("/api/auth/pin/set", { method: "POST", body: JSON.stringify({ pin, confirm_pin: confirmPin }) }, token);
}

export async function verifyPinLogin(email: string, pin: string) {
  return apiClient<MagicLinkBootstrap>("/api/auth/pin/verify", { method: "POST", body: JSON.stringify({ email, pin }) });
}