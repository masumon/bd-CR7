import { safeSupabase as supabase } from "@/lib/safeSupabase";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string | null;
};

/**
 * Always use same-origin relative paths so that the Next.js API proxy
 * (app/api/[...path]/route.ts) forwards requests to the Python backend.
 */
function buildApiUrl(path: string): string {
  return path;
}

async function apiPost<T>(path: string, token: string, payload: unknown): Promise<T> {
  const response = await fetchWithRetry(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const data = (await response.json()) as { detail?: string };
      detail = data?.detail || detail;
    } catch {
      const text = await response.text();
      detail = text || detail;
    }
    throw new Error(detail);
  }

  const json = (await response.json()) as T | ApiEnvelope<T>;
  if (json && typeof json === "object" && "success" in json) {
    const envelope = json as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new Error(envelope.error || "Request failed");
    }
    return envelope.data;
  }

  return json as T;
}

async function apiPostPublic<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetchWithRetry(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const data = (await response.json()) as { detail?: string; error?: string };
      detail = data?.detail || data?.error || detail;
    } catch {
      const text = await response.text();
      detail = text || detail;
    }
    throw new Error(detail);
  }

  const json = (await response.json()) as T | ApiEnvelope<T>;
  if (json && typeof json === "object" && "success" in json) {
    const envelope = json as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new Error(envelope.error || "Request failed");
    }
    return envelope.data;
  }

  return json as T;
}

type BiometricCredentialRow = {
  id: string;
  credential_id: string;
  device_name: string;
  is_active: boolean;
  sign_count: number;
  transports?: string[];
};

function toBase64UrlFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlToBuffer(input: string | undefined | null): ArrayBuffer {
  if (!input) return new ArrayBuffer(0);
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = normalized + (padding ? "=".repeat(4 - padding) : "");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function resolveRpId(): string {
  const envRpId = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID?.trim().toLowerCase();
  if (envRpId) return envRpId;
  return window.location.hostname.toLowerCase();
}

async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
    return true;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxAttempts) {
          await sleep(200 * attempt);
          continue;
        }
      }
      return response;
    } catch {
      if (attempt >= maxAttempts) {
        throw new Error("Network error while contacting auth service. Please retry.");
      }
      await sleep(200 * attempt);
    }
  }
  throw new Error("Request failed after retries.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function listBiometricCredentials(userId?: string): Promise<BiometricCredentialRow[]> {
  if (!supabase) return [];
  let query = supabase
    .from("biometric_credentials")
    .select("id, user_id, credential_id, device_name, is_active, sign_count, transports")
    .eq("is_active", true);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || "Failed to list biometric credentials");
  return (data ?? []) as BiometricCredentialRow[];
}

export async function ensureBiometricCredential(token: string, userId: string, userEmail: string): Promise<void> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this browser/device.");
  }
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const platformAuthenticatorAvailable = await isPlatformAuthenticatorAvailable();
  if (!platformAuthenticatorAvailable) {
    throw new Error("This mobile device does not expose a supported biometric or screen-lock authenticator for WebAuthn.");
  }

  const existing = await listBiometricCredentials(userId);
  if (existing.some((item) => item.is_active && item.credential_id)) {
    return;
  }

  const challenge = await apiPost<{
    challenge: string;
    rp_id: string;
    timeout?: number;
    exclude_credentials?: Array<{ id: string; type: PublicKeyCredentialType }>;
  }>("/api/auth/webauthn/register/challenge", token, {});

  const userBytes = new TextEncoder().encode(userId).slice(0, 64);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: fromBase64UrlToBuffer(challenge.challenge),
      rp: {
        name: "BD CR7",
        id: challenge.rp_id || resolveRpId(),
      },
      user: {
        id: userBytes,
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      timeout: challenge.timeout || 60_000,
      excludeCredentials: (challenge.exclude_credentials ?? []).filter((item) => item.id).map((item) => ({
        id: fromBase64UrlToBuffer(item.id),
        type: item.type,
      })),
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Biometric credential creation failed.");
  }

  const credentialId = toBase64UrlFromBuffer(credential.rawId);
  const attestationResponse = credential.response as AuthenticatorAttestationResponse & {
    getTransports?: () => string[];
  };
  const transports = typeof attestationResponse.getTransports === "function" ? attestationResponse.getTransports() : [];

  await apiPost<{ ok: boolean }>("/api/auth/webauthn/register", token, {
    credential_id: credentialId,
    attestation_object: toBase64UrlFromBuffer(attestationResponse.attestationObject),
    client_data_json: toBase64UrlFromBuffer(attestationResponse.clientDataJSON),
    device_name: "Primary Device",
    transports,
  });
}

export async function verifyBiometricAssertion(token: string): Promise<void> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this browser/device.");
  }

  const challenge = await apiPost<{
    challenge: string;
    rp_id: string;
    allow_credentials: Array<{ id: string; type: PublicKeyCredentialType }>;
    timeout?: number;
  }>("/api/auth/webauthn/challenge", token, {});

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: fromBase64UrlToBuffer(challenge.challenge),
      rpId: challenge.rp_id,
      allowCredentials: (challenge.allow_credentials ?? []).filter((item) => item.id).map((item) => ({
        id: fromBase64UrlToBuffer(item.id),
        type: item.type,
      })),
      timeout: challenge.timeout || 60_000,
      userVerification: "required",
    },
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Biometric verification was cancelled or failed.");
  }

  const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
  await apiPost<{ ok: boolean; verified: boolean }>("/api/auth/webauthn/verify", token, {
    credential_id: assertion.id,
    authenticator_data: toBase64UrlFromBuffer(assertionResponse.authenticatorData),
    client_data_json: toBase64UrlFromBuffer(assertionResponse.clientDataJSON),
    signature: toBase64UrlFromBuffer(assertionResponse.signature),
    user_handle: assertionResponse.userHandle ? toBase64UrlFromBuffer(assertionResponse.userHandle) : null,
  });
}

export async function signInWithPasskey(email: string): Promise<{ token_hash: string; email: string; type: "magiclink"; role?: string; user_id?: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error("Passkey is not supported on this browser/device.");
  }
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required for passkey sign in.");
  }

  const challenge = await apiPostPublic<{
    challenge: string;
    rp_id: string;
    allow_credentials: Array<{ id: string; type: PublicKeyCredentialType }>;
    timeout?: number;
  }>("/api/auth/passkey/challenge", { email: normalizedEmail });

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: fromBase64UrlToBuffer(challenge.challenge),
      rpId: challenge.rp_id,
      allowCredentials: (challenge.allow_credentials ?? []).filter((item) => item.id).map((item) => ({
        id: fromBase64UrlToBuffer(item.id),
        type: item.type,
      })),
      timeout: challenge.timeout || 60_000,
      userVerification: "required",
    },
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Passkey verification was cancelled or failed.");
  }

  const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
  return apiPostPublic<{ token_hash: string; email: string; type: "magiclink"; role?: string; user_id?: string }>("/api/auth/passkey/login", {
    email: normalizedEmail,
    credential_id: assertion.id,
    authenticator_data: toBase64UrlFromBuffer(assertionResponse.authenticatorData),
    client_data_json: toBase64UrlFromBuffer(assertionResponse.clientDataJSON),
    signature: toBase64UrlFromBuffer(assertionResponse.signature),
    user_handle: assertionResponse.userHandle ? toBase64UrlFromBuffer(assertionResponse.userHandle) : null,
  });
}
