"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, FormEvent, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Fingerprint,
  Facebook,
  Globe,
  MessageCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { DEVELOPER_CONFIG } from "@/lib/developers";
import { ensureBiometricCredential, verifyBiometricAssertion } from "@/lib/webauthn";
import { LoginLoadingOverlay } from "@/components/auth/LoginLoadingOverlay";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const persistedToken = useAuthStore((s) => s.token);
  const persistedUserId = useAuthStore((s) => s.userId);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricMode, setBiometricMode] = useState<"fingerprint" | "face">("fingerprint");
  const [error, setError] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  // Restore theme preference
  useEffect(() => {
    const stored = window.localStorage.getItem("bdcr7-theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setShowWelcome(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    if (!supabase) return;
    setLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    setError(
      resetErr ? resetErr.message : "Password reset email sent. Check your inbox."
    );
  };

  const handleBiometric = useCallback(async (mode: "fingerprint" | "face") => {
    setBiometricMode(mode);
    setBiometricLoading(true);
    setError("");
    try {
      const existingSession = await supabase?.auth.getSession();
      const session = existingSession?.data.session;
      const hasRememberedSession = Boolean(persistedToken || session);

      if (!hasRememberedSession) {
        setError("Biometric unlock needs a remembered session first. Sign in with email and password once, then try biometric unlock.");
        return;
      }

      const token = persistedToken || session?.access_token;
      const userId = persistedUserId || session?.user?.id;
      const userEmail = session?.user?.email || email || "bdcr7.user@local";

      if (!token || !userId) {
        setError("Session metadata is unavailable. Sign in with email/password first.");
        return;
      }

      await ensureBiometricCredential(token, userId, userEmail);
      await verifyBiometricAssertion(token);

      setShowWelcome(true);
    } catch (err) {
      const message = (err as Error).message || "Biometric quick unlock failed.";
      setError(message);
    } finally {
      setBiometricLoading(false);
    }
  }, [email, persistedToken, persistedUserId]);

  return (
    <>
    <LoginLoadingOverlay visible={showWelcome} onDone={() => router.push("/dashboard")} />
    <main className="login-shell auth-bg-dark auth-page flex flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <header className="pb-4 pt-3 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Welcome back</p>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-300/25 bg-slate-950/60 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            <Image src="/icons/icon.svg" alt="BD CR7 Logo" width={62} height={62} className="h-full w-full object-contain" priority />
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">BD CR7</h1>
        </header>

        <section className="auth-card rounded-3xl px-4 py-4">
          {error && (
            <div
              className={`mb-3 rounded-2xl border px-3.5 py-2.5 text-sm ${
                error.includes("sent") || error.includes("successfully")
                  ? "border-emerald-400/45 bg-emerald-900/20 text-emerald-200"
                  : "border-rose-400/45 bg-rose-900/20 text-rose-200"
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="auth-input-wrap px-3" data-filled={Boolean(email)} data-error={Boolean(error) && !email}>
              <Mail className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Email / ইমেইল</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <div className="auth-input-wrap px-3" data-filled={Boolean(password)} data-error={Boolean(error) && !password}>
              <Lock className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Password / পাসওয়ার্ড</label>
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="text-slate-300 transition-colors hover:text-white"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-amber-200/90 underline-offset-2 transition-colors hover:text-amber-100 hover:underline"
              >
                Forgot password? / পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <div className="auth-sticky-cta">
              <button
                type="submit"
                disabled={loading}
                className="btn-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign in / সাইন ইন"}
              </button>
            </div>
          </form>

          <p className="mt-1 text-center text-xs text-slate-300/95">
            No account? / অ্যাকাউন্ট নেই?{" "}
            <Link href="/register" className="font-semibold text-amber-200 hover:text-amber-100">
              Create one / তৈরি করুন
            </Link>
          </p>

          <div className="mt-4 rounded-2xl border border-slate-500/30 bg-slate-950/45 px-3.5 py-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.12em] text-slate-200 uppercase">Quick Unlock</span>
              <Fingerprint className="h-4 w-4 text-amber-200" />
            </div>
            <button
              type="button"
              onClick={() => handleBiometric("fingerprint")}
              disabled={biometricLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-amber-300/10 text-sm font-semibold text-amber-100 transition-all hover:bg-amber-300/16 active:scale-[0.98] disabled:opacity-60"
            >
              {biometricLoading && biometricMode === "fingerprint" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="h-4 w-4" />
              )}
              Unlock with Biometric
            </button>
            <p className="mt-2 text-[11px] leading-5 text-slate-300/85">
              Quick unlock requires a remembered session and platform biometric verification via WebAuthn.
            </p>
          </div>
        </section>

        <footer className="mt-auto pb-2 pt-4">
          <div className="border-t border-slate-500/35 pt-3 text-center">
            <p className="text-sm font-bold tracking-wide text-white">{DEVELOPER_CONFIG.name}</p>
            <p className="mt-1 text-xs text-slate-300/95">{DEVELOPER_CONFIG.role}</p>
            <p className="mt-1 text-[11px] text-slate-400">{DEVELOPER_CONFIG.powerLine}</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <a href={DEVELOPER_CONFIG.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="auth-social-icon">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={DEVELOPER_CONFIG.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="auth-social-icon">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href={`mailto:${DEVELOPER_CONFIG.email}`} aria-label="Email" className="auth-social-icon">
                <Mail className="h-5 w-5" />
              </a>
              <a href={DEVELOPER_CONFIG.website} target="_blank" rel="noreferrer" aria-label="Website" className="auth-social-icon">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
    </>
  );
}
