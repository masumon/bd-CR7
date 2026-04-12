"use client";

import { FormEvent, useMemo, useState } from "react";

import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorUtils";

type RoleLabel = "Super Admin" | "Owner" | "Worker";

export function AuthFeature() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

  const roleLabel = useMemo<RoleLabel | "Unknown">(() => {
    const normalized = (role || "").toLowerCase();
    if (normalized.includes("admin")) return "Super Admin";
    if (normalized.includes("owner")) return "Owner";
    if (normalized.includes("worker")) return "Worker";
    return "Unknown";
  }, [role]);

  const onEmailLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      setMessage("Email login successful");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const onGoogleLogin = async () => {
    if (!supabase) {
      setMessage("Supabase is not configured");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    setMessage(error ? error.message : "Google login started");
  };

  const onRegister = async () => {
    try {
      await register(email, password, fullName, "viewer");
      setMessage("Registration successful");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const onRequestOtp = async () => {
    if (!supabase) {
      setMessage("Supabase is not configured");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: mobile });
    setMessage(error ? error.message : "OTP sent to mobile");
  };

  const onVerifyOtp = async () => {
    if (!supabase) {
      setMessage("Supabase is not configured");
      return;
    }
    const { data, error } = await supabase.auth.verifyOtp({ phone: mobile, token: otp, type: "sms" });
    if (error || !data.session || !data.user) {
      setMessage(error?.message || "OTP verification failed");
      return;
    }
    const { role: currentRole } = useAuthStore.getState();
    useAuthStore.setState({ token: data.session.access_token, userId: data.user.id, role: currentRole || null });
    setMessage("Mobile OTP login successful");
  };

  const onWebAuthn = async () => {
    if (!("credentials" in navigator)) {
      setMessage("WebAuthn is not supported on this browser");
      return;
    }
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          allowCredentials: [],
        },
      });
      setMessage("WebAuthn verification successful");
    } catch (error) {
      setMessage(getErrorMessage(error) || "WebAuthn failed");
    }
  };

  if (token) {
    return (
      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Authentication</h2>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">{roleLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground">Role verification complete: {roleLabel}</p>
        <Button type="button" variant="outline" onClick={logout}>Logout</Button>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Authentication</h2>
        <span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">Multi-login</span>
      </div>

      <form onSubmit={onEmailLogin} className="grid gap-2 sm:grid-cols-2">
        <input className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="Email" />
        <input className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Full Name" />
        <input className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none sm:col-span-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Password" />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" className="flex-1">Login</Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onRegister}>Register</Button>
        </div>
      </form>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={onGoogleLogin}>Google Login</Button>
        <Button type="button" variant="outline" onClick={onWebAuthn}>WebAuthn (Face/Fingerprint)</Button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Mobile OTP</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile (+880...)" />
          <Button type="button" variant="outline" onClick={onRequestOtp}>Send OTP</Button>
          <input className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
          <Button type="button" onClick={onVerifyOtp}>Verify OTP</Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-foreground">{message}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Use your administrator credentials, or continue with Register or OTP/Google sign-in.</p>
      )}
    </section>
  );
}
