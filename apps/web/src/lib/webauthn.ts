import { safeSupabase as supabase } from "@/lib/safeSupabase";

/**
 * Always use same-origin relative paths so that the Next.js API proxy
 * (app/api/[...path]/route.ts) forwards requests to the Python backend.
 */
function buildApiUrl(path: string): string {
  return path;
}

async function apiPost<T>(path: string, token: string, payload: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
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

  return (await response.json()) as T;
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

function fromBase64UrlToBuffer(input: string): ArrayBuffer {
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

function randomChallenge(size = 32): ArrayBuffer {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function listBiometricCredentials(): Promise<BiometricCredentialRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("biometric_credentials")
    .select("id, credential_id, device_name, is_active, sign_count, transports")
    .eq("is_active", true);
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

  const existing = await listBiometricCredentials();
  if (existing.some((item) => item.is_active && item.credential_id)) {
    return;
  }

  const userBytes = new TextEncoder().encode(userId).slice(0, 64);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: {
        name: "BD CR7",
        id: window.location.hostname,
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
      timeout: 60_000,
      authenticatorSelection: {
        userVerification: "preferred",
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
    getPublicKey?: () => ArrayBuffer | null;
  };
  const transports = typeof attestationResponse.getTransports === "function" ? attestationResponse.getTransports() : [];
  const publicKeyBuffer = typeof attestationResponse.getPublicKey === "function" ? attestationResponse.getPublicKey() : null;
  if (!publicKeyBuffer) {
    throw new Error("Authenticator did not expose a public key; cannot enroll biometric securely.");
  }
  const publicKey = toBase64UrlFromBuffer(publicKeyBuffer);

  await apiPost<{ ok: boolean }>("/api/auth/webauthn/register", token, {
    credential_id: credentialId,
    public_key: publicKey,
    device_name: "Primary Device",
    transports,
    sign_count: 0,
    user_id: userId,
    user_email: userEmail,
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
      allowCredentials: challenge.allow_credentials.map((item) => ({
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
