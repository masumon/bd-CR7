"use client";

import Image from "next/image";
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
    <main
      className="login-shell flex flex-col auth-bg-dark safe-bottom overflow-y-auto"
    >
      {/* TOP SECTION: Greeting & Branding */}
      <div className="flex-none px-6 pt-10 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70 mb-4">
          Welcome back
        </p>
        <div className="inline-flex flex-col items-center gap-2">
          <div className="h-20 w-20 rounded-full overflow-hidden shadow-[0_4px_24px_rgba(201,168,76,0.28)]">
            <Image
              src="/icons/icon.svg"
              alt="BD CR7 Logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            BD CR7
          </h1>
          <p className="text-xs text-muted-foreground">Smart · Secure · AI Powered</p>
        </div>
      </div>

      {/* MIDDLE SECTION: Login Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-4">
        <div className="w-full max-w-sm space-y-4">
          {error && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                error.includes("sent") || error.includes("successfully")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-300"
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Email / ইমেইল
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/90 px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 dark:bg-slate-900/70 transition-all">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Password / পাসওয়ার্ড
                </label>
                <a
                  href="/forgot-password"
                  className="text-[11px] text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors"
                >
                  Forgot password? / পাসওয়ার্ড ভুলে গেছেন?
                </a>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/90 px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 dark:bg-slate-900/70 transition-all">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in / সাইন ইন"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            No account? / অ্যাকাউন্ট নেই?{" "}
            <a
              href="/register"
              className="font-medium text-primary hover:underline underline-offset-2"
            >
              Create one / তৈরি করুন
            </a>
          </p>
        </div>
      </div>

      {/* LOWER SECTION: Biometrics */}
      <div className="flex-none px-6 py-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <span className="flex-1 h-px bg-border/60" />
          <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
            or biometric / বায়োমেট্রিক
          </span>
          <span className="flex-1 h-px bg-border/60" />
        </div>
        <div className="w-full max-w-sm pt-1">
          <button
            type="button"
            onClick={() => handleBiometric("fingerprint")}
            disabled={biometricLoading}
            className="group relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-primary/30 bg-primary/5 p-3 text-primary transition-all hover:bg-primary/10 disabled:opacity-60"
          >
            <motion.span
              className="absolute inset-4 rounded-full border border-primary/35"
              animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.1, 0.45] }}
              transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute inset-1.5 rounded-full border border-primary/20"
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.08, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            />
            <span className="relative z-10 flex flex-col items-center justify-center gap-2">
              {biometricLoading && biometricMode === "fingerprint" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Fingerprint className="h-8 w-8" />
              )}
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Unlock</span>
            </span>
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
            Quick unlock requires a remembered session and platform biometric verification via WebAuthn.
          </p>
        </div>
      </div>

      {/* FOOTER SECTION: Developer Info & Socials */}
      <footer className="flex-none px-6 pb-5 pt-3">
        <div className="border-t border-border/40 pt-4 text-center space-y-1.5">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-foreground/80">
            {DEVELOPER_CONFIG.name}
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-xs mx-auto">
            {DEVELOPER_CONFIG.role}
          </p>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground/70">
            {DEVELOPER_CONFIG.powerLine}
          </p>
          <div className="flex items-center justify-center gap-4 pt-1">
            <a
              href={DEVELOPER_CONFIG.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="text-muted-foreground/60 hover:text-primary transition-colors"
            >
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a
              href={DEVELOPER_CONFIG.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="text-muted-foreground/60 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
            <a
              href={`mailto:${DEVELOPER_CONFIG.email}`}
              aria-label="Email"
              className="text-muted-foreground/60 hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
            <a
              href={DEVELOPER_CONFIG.website}
              target="_blank"
              rel="noreferrer"
              aria-label="Website"
              className="text-muted-foreground/60 hover:text-primary transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
