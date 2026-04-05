"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, FormEvent, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Fingerprint,
  Globe,
  ChevronDown,
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
  const [authTransitionDone, setAuthTransitionDone] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

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
    setAuthTransitionDone(false);
    setLoading(true);
    try {
      await login(email, password);
      setShowWelcome(true);
      setAuthTransitionDone(true);
    } catch (err) {
      setError((err as Error).message);
      setShowWelcome(false);
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
        setShowEmailForm(true);
        return;
      }

      const token = persistedToken || session?.access_token;
      const userId = persistedUserId || session?.user?.id;
      const userEmail = session?.user?.email || email || "bdcr7.user@local";

      if (!token || !userId) {
        setError("Session metadata is unavailable. Sign in with email/password first.");
        setShowEmailForm(true);
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
      <LoginLoadingOverlay
        visible={loading || showWelcome}
        complete={authTransitionDone}
        onDone={() => router.push("/dashboard")}
      />

      <main className="login-shell auth-bg-dark h-[100dvh] overflow-hidden flex flex-col items-center px-5">

        {/* ── Logo (top) ── */}
        <header className="w-full pt-[max(2rem,env(safe-area-inset-top))] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-slate-950/60 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.32)]">
            <Image src="/icons/icon.svg" alt="BD CR7 Logo" width={52} height={52} className="h-full w-full object-contain" priority />
          </div>
          <h1 className="mt-2 font-display text-lg font-bold tracking-tight text-white">BD CR7</h1>
        </header>

        {/* flex spacer — slightly larger to push button below center */}
        <div className="flex-1" />

        {/* ── Biometric hero (~55% from top) ── */}
        <div className="flex flex-col items-center gap-3">
          {/* Error message */}
          {error && (
            <div className={`max-w-[270px] rounded-2xl border px-3 py-2 text-center text-[11px] leading-5 ${
              error.includes("sent") || error.includes("successfully")
                ? "border-emerald-400/40 bg-emerald-900/20 text-emerald-200"
                : "border-rose-400/40 bg-rose-900/20 text-rose-200"
            }`}>
              {error}
            </div>
          )}

          {/* 96px touch target wrapping the clamp-sized button */}
          <div
            className="flex items-center justify-center"
            style={{ width: 96, height: 96 }}
          >
            <button
              type="button"
              onClick={() => handleBiometric("fingerprint")}
              disabled={biometricLoading}
              aria-label="Sign in with biometric"
              className="biometric-hero-btn flex items-center justify-center rounded-full"
              style={{
                width: "clamp(64px, 18vw, 84px)",
                height: "clamp(64px, 18vw, 84px)",
              }}
            >
              {biometricLoading && biometricMode === "fingerprint" ? (
                <Loader2 className="h-7 w-7 animate-spin text-amber-200/80" />
              ) : (
                <Fingerprint
                  className="text-amber-200/88"
                  style={{ width: "44%", height: "44%" }}
                />
              )}
            </button>
          </div>

          {/* Subtle email-form toggle */}
          <button
            type="button"
            onClick={() => setShowEmailForm((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-white/38 transition-colors hover:text-white/60"
          >
            {showEmailForm ? "Use biometric" : "Sign in with email"}
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${showEmailForm ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* flex spacer — smaller to sit at ~55% */}
        <div className="flex-[0.8]" />

        {/* ── Developer credit (bottom) ── */}
        <footer className="w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="h-px w-full bg-white/[0.11]" />
          <div className="pt-2.5 text-center">
            <p className="text-sm font-bold tracking-wide text-white">{DEVELOPER_CONFIG.name}</p>
            <p className="mt-0.5 text-[11px] text-white/52">AI Solution Architect</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <a href={DEVELOPER_CONFIG.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="auth-social-icon auth-social-icon--facebook">
                <img src="/icons/brands/facebook.svg" alt="Facebook" width={22} height={22} />
              </a>
              <a href={DEVELOPER_CONFIG.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="auth-social-icon auth-social-icon--whatsapp">
                <img src="/icons/brands/whatsapp.svg" alt="WhatsApp" width={22} height={22} />
              </a>
              <a href={`mailto:${DEVELOPER_CONFIG.email}`} aria-label="Email" className="auth-social-icon auth-social-icon--email">
                <Mail className="h-[22px] w-[22px]" />
              </a>
              <a href={DEVELOPER_CONFIG.website} target="_blank" rel="noreferrer" aria-label="Website" className="auth-social-icon auth-social-icon--web">
                <Globe className="h-[22px] w-[22px]" />
              </a>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Email / password form (visually hidden when not shown; in DOM for functionality) ── */}
      <div
        aria-hidden={!showEmailForm}
        className={`fixed inset-x-0 z-50 px-5 transition-all duration-300 ${
          showEmailForm
            ? "bottom-[max(6rem,calc(6rem+env(safe-area-inset-bottom)))] opacity-100 pointer-events-auto translate-y-0"
            : "bottom-0 opacity-0 pointer-events-none translate-y-3"
        }`}
      >
        <div className="auth-card mx-auto w-full max-w-sm rounded-3xl px-4 py-4">
          <form onSubmit={handleLogin} className="space-y-2.5">
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

            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in / সাইন ইন"}
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-slate-300/90">
            No account? / অ্যাকাউন্ট নেই?{" "}
            <Link href="/register" className="font-semibold text-amber-200 hover:text-amber-100">
              Create one / তৈরি করুন
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
