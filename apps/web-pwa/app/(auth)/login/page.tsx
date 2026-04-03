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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricMode, setBiometricMode] = useState<"fingerprint" | "face">("fingerprint");
  const [error, setError] = useState("");

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
      router.push("/dashboard");
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

  const handleBiometric = useCallback(async (mode: "fingerprint" | "face", silent = false) => {
    if (!("credentials" in navigator)) {
      if (!silent) {
        setError("Biometric login is not supported on this device.");
      }
      return;
    }
    setBiometricMode(mode);
    setBiometricLoading(true);
    setError("");
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
      router.push("/dashboard");
    } catch (err) {
      if (!silent) {
        setError((err as Error).message || "Biometric authentication failed.");
      }
    } finally {
      setBiometricLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const isLikelyMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isLikelyMobile || !("credentials" in navigator)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void handleBiometric("face", true);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [handleBiometric]);

  return (
    <main
      className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-[#eef2ec] via-white to-[#e8f5ec] safe-top safe-bottom dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      {/* TOP SECTION: Greeting & Branding */}
      <div className="flex-none px-6 pt-10 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70 mb-4">
          Welcome back
        </p>
        <div className="inline-flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-3xl border border-primary/15 bg-white/90 p-2 shadow-[0_4px_20px_rgba(15,108,90,0.15)] dark:bg-slate-900/80">
            <Image
              src="/icons/icon.svg"
              alt="BD CR7 Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
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
                Email
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
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(15,108,90,0.35)] transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            No account?{" "}
            <a
              href="/register"
              className="font-medium text-primary hover:underline underline-offset-2"
            >
              Create one
            </a>
          </p>
        </div>
      </div>

      {/* LOWER SECTION: Biometrics */}
      <div className="flex-none px-6 py-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <span className="flex-1 h-px bg-border/60" />
          <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
            or biometric
          </span>
          <span className="flex-1 h-px bg-border/60" />
        </div>
        <div className="w-full max-w-sm pt-1">
          <button
            type="button"
            onClick={() => handleBiometric("fingerprint")}
            disabled={biometricLoading}
            className="group relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-primary/30 bg-primary/5 p-3 text-primary transition-all hover:bg-primary/10 disabled:opacity-60"
          >
            <motion.span
              className="absolute inset-5 rounded-full border border-primary/35"
              animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.1, 0.45] }}
              transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute inset-2 rounded-full border border-primary/20"
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.08, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            />
            <span className="relative z-10 flex flex-col items-center justify-center gap-2">
              {biometricLoading && biometricMode === "fingerprint" ? (
                <Loader2 className="h-9 w-9 animate-spin" />
              ) : (
                <Fingerprint className="h-10 w-10" />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Fingerprint</span>
            </span>
          </button>
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
  );
}
