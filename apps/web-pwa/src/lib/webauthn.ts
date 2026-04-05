import { supabase } from "@/lib/supabase";

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
  if (existing.some((item) => item.is_active)) {
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
  };
  const transports = typeof attestationResponse.getTransports === "function" ? attestationResponse.getTransports() : [];

  const { error: insertError } = await supabase
    .from("biometric_credentials")
    .insert({
      credential_id: credentialId,
      device_name: "Primary Device",
      transports,
      sign_count: 0,
    });
  if (insertError) {
    throw new Error(insertError.message || "Failed to save biometric credential.");
  }
}

export async function verifyBiometricAssertion(token: string): Promise<void> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this browser/device.");
  }

  const credentials = await listBiometricCredentials();
  const activeCredentials = credentials.filter((item) => item.is_active);
  if (!activeCredentials.length) {
    throw new Error("No biometric credential is enrolled for this account. Sign in once and enroll biometric first.");
  }

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: activeCredentials.map((item) => ({
        id: fromBase64UrlToBuffer(item.credential_id),
        type: "public-key",
      })),
      timeout: 60_000,
      userVerification: "required",
    },
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Biometric verification was cancelled or failed.");
  }
}
