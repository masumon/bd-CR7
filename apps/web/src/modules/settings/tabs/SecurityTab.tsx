"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Fingerprint, Loader2, Lock, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errorUtils";
import { fetchSecuritySettings, setLoginPin, type SecuritySettings, updateSecuritySettings } from "@/lib/securityAuth";
import { ensureBiometricCredential, isWebAuthnSupported } from "@/lib/webauthn";
import type { UserProfile } from "@/modules/settings/model";

type SecurityTabProps = {
  token?: string;
  userId: string | null;
  profile: UserProfile | null;
};

export function SecurityTab({ token, userId, profile }: SecurityTabProps) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinForm, setShowPinForm] = useState(false);

  const biometricSupported = useMemo(() => isWebAuthnSupported(), []);

  const loadSettings = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const next = await fetchSecuritySettings({ token });
      setSettings(next);
      setShowPinForm(!next.pin_configured);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const toggleBiometric = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const next = await updateSecuritySettings(token, { biometric_enabled: enabled });
      setSettings(next);
      setMessage(enabled ? "Biometric sign-in enabled for this device." : "Biometric sign-in disabled.");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setSaving(false);
    }
  }, [token]);

  const togglePin = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const next = await updateSecuritySettings(token, { pin_enabled: enabled });
      setSettings(next);
      setShowPinForm(!next.pin_configured && enabled);
      setMessage(enabled ? "PIN sign-in enabled." : "PIN sign-in disabled.");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setSaving(false);
    }
  }, [token]);

  const handleRegisterCurrentDevice = useCallback(async () => {
    if (!token || !userId || !profile?.email) return;
    setRegistering(true);
    setError("");
    setMessage("");
    try {
      await ensureBiometricCredential(token, userId, profile.email);
      const next = await updateSecuritySettings(token, { biometric_enabled: true });
      setSettings(next);
      setMessage("Current device registered for biometric sign-in.");
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setRegistering(false);
    }
  }, [profile?.email, token, userId]);

  const handleSavePin = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const next = await setLoginPin(token, pin, confirmPin);
      setSettings(next);
      setPin("");
      setConfirmPin("");
      setShowPinForm(false);
      setMessage("PIN saved and enabled for trusted-device login.");
    } catch (pinError) {
      setError(getErrorMessage(pinError));
    } finally {
      setSaving(false);
    }
  }, [confirmPin, pin, token]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading security settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {(error || message) ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-rose-300/40 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-300/40 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
          <div className="flex items-start gap-2">
            {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{error || message}</span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="h-4 w-4" />Biometric Sign-In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Current status</p>
              <p className="mt-1">{settings?.biometric_enabled ? "Enabled for the trusted device." : "Disabled. Email/password remains active."}</p>
              <p className="mt-2">{biometricSupported ? "This browser exposes WebAuthn and can use face, fingerprint, or platform passkeys." : "This browser or device does not expose WebAuthn, so biometric sign-in stays hidden on the login screen."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Trusted Device</p>
                <p className="mt-2 text-sm font-medium text-foreground">{settings?.trusted_device_label || "No device trusted yet"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{settings?.current_device_trusted ? "This device matches the bound login profile." : "This device needs password re-auth and registration before biometric login."}</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Registered Credentials</p>
                <p className="mt-2 text-sm font-medium text-foreground">{settings?.credential_count || 0} active</p>
                <p className="mt-1 text-xs text-muted-foreground">Only WebAuthn public-key credentials are stored. No biometric template leaves the device.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleRegisterCurrentDevice} disabled={!token || !userId || !profile?.email || !biometricSupported || registering}>
                {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Register Current Device
              </Button>
              <Button type="button" variant="outline" onClick={() => void toggleBiometric(!(settings?.biometric_enabled ?? false))} disabled={saving || !biometricSupported || !(settings?.has_biometric_credentials)}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                {settings?.biometric_enabled ? "Disable Biometric" : "Enable Biometric"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4" />PIN Sign-In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Current status</p>
              <p className="mt-1">{settings?.pin_enabled ? "PIN sign-in enabled on the trusted device." : "PIN sign-in disabled."}</p>
              <p className="mt-2">PINs are stored as bcrypt hashes, capped at 5 failed attempts, and locked for 5 minutes on repeated failures.</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Trusted-device enforcement</p>
                  <p className="mt-1 text-xs text-muted-foreground">If the browser or installed PWA changes, password sign-in is required once before PIN or biometric methods reappear.</p>
                </div>
              </div>
            </div>

            {(showPinForm || !settings?.pin_configured) ? (
              <div className="grid gap-3">
                <input
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Set 4-8 digit PIN"
                  className="h-11 rounded-2xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
                />
                <input
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Confirm PIN"
                  className="h-11 rounded-2xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={handleSavePin} disabled={saving || pin.length < 4 || confirmPin.length < 4}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    Save PIN
                  </Button>
                  {settings?.pin_configured ? <Button type="button" variant="outline" onClick={() => setShowPinForm(false)} disabled={saving}>Cancel</Button> : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setShowPinForm(true)} disabled={saving}>Change PIN</Button>
                <Button type="button" onClick={() => void togglePin(!(settings?.pin_enabled ?? false))} disabled={saving || !settings?.pin_configured}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  {settings?.pin_enabled ? "Disable PIN" : "Enable PIN"}
                </Button>
              </div>
            )}

            {settings?.pin_locked_until ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">PIN lockout active until {new Date(settings.pin_locked_until).toLocaleString()}.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}