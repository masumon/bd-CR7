"use client";

import { FormEvent, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

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
      setMessage((error as Error).message);
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
      setMessage((error as Error).message);
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
      setMessage((error as Error).message || "WebAuthn failed");
    }
  };

  if (token) {
    return (
      <section className="module authPanel authPanelActive">
        <div className="panelHeader">
          <h2>Authentication</h2>
          <span className="roleBadge">{roleLabel}</span>
        </div>
        <p className="panelLead">Role verification complete: {roleLabel}</p>
        <button type="button" onClick={logout}>Logout</button>
      </section>
    );
  }

  return (
    <section className="module authPanel">
      <div className="panelHeader">
        <h2>Authentication</h2>
        <span className="roleBadge roleBadgeMuted">Multi-login</span>
      </div>

      <form onSubmit={onEmailLogin} className="formGrid">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="Email" />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Full Name" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Password" />
        <div className="actions">
          <button type="submit">Login</button>
          <button type="button" onClick={onRegister}>Register</button>
        </div>
      </form>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onGoogleLogin}>Google Login</button>
        <button type="button" onClick={onWebAuthn}>WebAuthn (Face/Fingerprint)</button>
      </div>

      <div className="mt-3 grid gap-2">
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile (+880...)" />
        <div className="flex gap-2">
          <button type="button" onClick={onRequestOtp}>Send OTP</button>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
          <button type="button" onClick={onVerifyOtp}>Verify OTP</button>
        </div>
      </div>

      {message ? <p className="panelMessage">{message}</p> : <p className="panelMessage">Use your administrator credentials, or continue with Register or OTP/Google sign-in.</p>}
    </section>
  );
}
