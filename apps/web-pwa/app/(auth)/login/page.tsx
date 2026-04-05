"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Phone,
  User,
  Fingerprint,
  ChevronLeft,
  Globe,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Shield,
  RefreshCcw,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { DEVELOPER_CONFIG } from "@/lib/developers";
import { ensureBiometricCredential, verifyBiometricAssertion } from "@/lib/webauthn";
import { LoginLoadingOverlay } from "@/components/auth/LoginLoadingOverlay";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

type View = "splash" | "landing" | "signin" | "signup" | "otp";

const easeAuth = [0.4, 0, 0.2, 1] as const;
const slideRight = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
};
const slideLeft = {
  initial: { opacity: 0, x: -36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 36 },
};
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};

/* ── Theme toggle ── */
function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("bdcr7-theme");
    setIsDark(stored ? stored === "dark" : document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("bdcr7-theme", next ? "dark" : "light");
  };
  return (
    <button type="button" onClick={toggle} aria-label="Toggle theme" className="theme-toggle-bdcr7">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/* ── Branding footer — no personal name ── */
function DevFooter() {
  return (
    <footer className="w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="h-px w-full bg-white/[0.08]" />
      <div className="pt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <p
          className="text-[10px] tracking-[0.15em] whitespace-nowrap"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          Powered by{" "}
          <span className="gold-text-gradient font-semibold uppercase tracking-[0.18em]">
            SUMONIX AI
          </span>
        </p>
        <div className="flex items-center gap-2">
          <a
            href={DEVELOPER_CONFIG.facebook}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="auth-social-icon auth-social-icon--facebook"
          >
            <img src="/icons/brands/facebook.svg" alt="Facebook" width={16} height={16} />
          </a>
          <a
            href={DEVELOPER_CONFIG.whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="auth-social-icon auth-social-icon--whatsapp"
          >
            <img src="/icons/brands/whatsapp.svg" alt="WhatsApp" width={16} height={16} />
          </a>
          <a
            href={`mailto:${DEVELOPER_CONFIG.email}`}
            aria-label="Email"
            className="auth-social-icon auth-social-icon--email"
          >
            <Mail className="h-[16px] w-[16px]" />
          </a>
          <a
            href={DEVELOPER_CONFIG.website}
            target="_blank"
            rel="noreferrer"
            aria-label="Website"
            className="auth-social-icon auth-social-icon--web"
          >
            <Globe className="h-[16px] w-[16px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ── Social row ── */
function SocialRow({ onGoogle, loading }: { onGoogle: () => void; loading: boolean }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.1]" />
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>
          Or continue with
        </span>
        <span className="h-px flex-1 bg-white/[0.1]" />
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          title="Continue with Google"
          className="social-btn-bdcr7"
          aria-label="Continue with Google"
        >
          <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>
        <button
          type="button"
          disabled
          title="Facebook (Coming Soon)"
          className="social-btn-bdcr7"
          aria-label="Facebook — Coming Soon"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.03 4.388 11.026 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.27h3.328l-.532 3.49h-2.796v8.437C19.612 23.1 24 18.103 24 12.073z"/>
          </svg>
        </button>
        <button
          type="button"
          disabled
          title="Microsoft (Coming Soon)"
          className="social-btn-bdcr7"
          aria-label="Microsoft — Coming Soon"
        >
          <svg className="h-[16px] w-[16px]" viewBox="0 0 21 21" fill="none">
            <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
            <rect x="11" y="0" width="10" height="10" fill="#7FBA00"/>
            <rect x="0" y="11" width="10" height="10" fill="#00A4EF"/>
            <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
          </svg>
        </button>
        <button
          type="button"
          disabled
          title="Apple (Coming Soon)"
          className="social-btn-bdcr7"
          aria-label="Apple — Coming Soon"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   VIEW 1 — SPLASH
   ═══════════════════════════════════════ */
function SplashView() {
  return (
    <motion.main
      key="splash"
      {...fadeUp}
      transition={{ duration: 0.45, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-5"
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.95, 1, 0.95] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="mb-6 rounded-3xl border border-amber-300/20 bg-slate-900/60 p-5 shadow-[0_0_48px_rgba(251,189,35,0.18)]"
      >
        <Image src="/icons/icon.svg" alt="BD CR7" width={88} height={88} priority />
      </motion.div>

      <h1
        className="text-3xl font-bold tracking-tight text-white"
        style={{ fontFamily: "var(--font-outfit-var)" }}
      >
        Welcome / <span style={{ fontFamily: "var(--font-hind-var)" }}>স্বাগতম</span>
      </h1>

      <div className="mt-6 flex items-center justify-center gap-2.5">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--bdcr7-gold)" }}
            animate={{ scale: [1, 1.45, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 0.95, delay: dot * 0.16, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.32)" }}>
          Powered by
        </p>
        <p className="mt-0.5 text-sm font-bold uppercase tracking-[0.18em] gold-text-gradient">
          SUMONIX AI
        </p>
      </div>
    </motion.main>
  );
}

/* ═══════════════════════════════════════
   VIEW 2 — LANDING
   ═══════════════════════════════════════ */
type BiometricState = "idle" | "scanning" | "success" | "failed";

interface LandingViewProps {
  onSignin: () => void;
  onSignup: () => void;
  onOtp: () => void;
  onBiometric: () => void;
  bioLoading: boolean;
  bioError: string;
  bioState: BiometricState;
}
function LandingView({ onSignin, onSignup, onOtp, onBiometric, bioLoading, bioError, bioState }: LandingViewProps) {
  return (
    <motion.main
      key="landing"
      {...fadeUp}
      transition={{ duration: 0.4, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col items-center overflow-hidden px-5"
      style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top))" }}
    >
      {/* Logo */}
      <header className="flex flex-col items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full bg-[#0e1f3b] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          style={{
            width: 140,
            height: 140,
            border: "2.5px solid rgba(251,189,35,0.55)",
          }}
        >
          <Image src="/icons/icon.svg" alt="BD CR7" width={110} height={110} className="object-contain" style={{ width: 110, height: 110 }} />
        </div>
        <p
          className="text-2xl font-bold tracking-widest"
          style={{ fontFamily: "var(--font-outfit-var)", color: "var(--bdcr7-gold)" }}
        >
          BD CR7
        </p>
      </header>

      {/* Welcome heading */}
      <h2
        className="mt-6 text-center text-4xl font-extrabold text-white"
        style={{ fontFamily: "var(--font-outfit-var)", letterSpacing: "-0.01em" }}
      >
        Welcome Back
      </h2>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Buttons */}
      <div className="w-full max-w-sm space-y-3">
        {/* Sign Up — outline */}
        <button
          type="button"
          onClick={onSignup}
          className="btn-bdcr7-outline flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold"
          aria-label="Sign Up"
        >
          <User className="h-5 w-5" />
          Sign Up / <span style={{ fontFamily: "var(--font-hind-var)" }}>নতুন একাউন্ট</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.1]" />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>or</span>
          <span className="h-px flex-1 bg-white/[0.1]" />
        </div>

        {/* Login with OTP */}
        <button
          type="button"
          onClick={onOtp}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/80 transition-all hover:bg-white/[0.07] hover:border-amber-300/25 active:scale-[0.97]"
          style={{ height: "52px" }}
          aria-label="Login with OTP"
        >
          <MessageSquare className="h-5 w-5 text-amber-300/70" />
          Login with OTP
        </button>

        {/* Sign In — gold filled (primary CTA) */}
        <button
          type="button"
          onClick={onSignin}
          className="btn-bdcr7-gold flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base"
          aria-label="Sign In"
        >
          <Lock className="h-5 w-5" />
          Sign In / <span style={{ fontFamily: "var(--font-hind-var)" }}>লগইন</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Biometric — bottom thumb zone, above footer */}
      <div className="flex w-full max-w-sm flex-col items-center gap-2 pb-3">
        {bioError && bioState !== "failed" && (
          <p className="max-w-[250px] text-center text-[11px] leading-5 text-rose-300/90">{bioError}</p>
        )}

        <AnimatePresence mode="wait">
          {bioState === "success" ? (
            <motion.div
              key="bio-success"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-[11px] text-emerald-300">Biometric verified!</p>
            </motion.div>
          ) : (
            <motion.div
              key="bio-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="fingerprint-ring relative flex items-center justify-center rounded-full border-2 transition-colors"
                style={{
                  width: 100,
                  height: 100,
                  borderColor:
                    bioState === "scanning"
                      ? "rgba(251,189,35,0.7)"
                      : bioState === "failed"
                      ? "rgba(248,113,113,0.5)"
                      : "rgba(251,189,35,0.4)",
                }}
              >
                {bioState === "scanning" && <div className="fingerprint-scan-line" />}
                <button
                  type="button"
                  onClick={onBiometric}
                  disabled={bioLoading}
                  aria-label="Tap to scan fingerprint"
                  className="biometric-hero-btn flex items-center justify-center rounded-full"
                  style={{ width: 78, height: 78 }}
                >
                  {bioState === "scanning" ? (
                    <Loader2 className="h-7 w-7 animate-spin text-amber-200/80" />
                  ) : (
                    <Fingerprint
                      style={{ width: "46%", height: "46%" }}
                      className={bioState === "failed" ? "text-rose-300/80" : "text-amber-200/90"}
                    />
                  )}
                </button>
              </div>

              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.52)" }}>
                {bioState === "scanning"
                  ? "Scanning..."
                  : bioState === "failed"
                  ? "Biometric failed"
                  : "Tap to scan fingerprint"}
              </p>

              {bioState === "failed" && (
                <button
                  type="button"
                  onClick={onSignin}
                  className="text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "rgba(251,189,35,0.85)" }}
                >
                  Use password instead
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <DevFooter />
    </motion.main>
  );
}
/* ═══════════════════════════════════════
   VIEW 3 — SIGN IN
   ═══════════════════════════════════════ */
interface SigninViewProps {
  onBack: () => void;
  onSignup: () => void;
  onOtp: () => void;
  onGoogle: () => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  remember: boolean;
  setRemember: (v: boolean) => void;
  capsLock: boolean;
  setCapsLock: (v: boolean) => void;
  error: string;
}
function SigninView({
  onBack, onSignup, onOtp, onGoogle, loading, onSubmit,
  email, setEmail, password, setPassword,
  showPass, setShowPass, remember, setRemember,
  capsLock, setCapsLock, error,
}: SigninViewProps) {
  return (
    <motion.main
      key="signin"
      {...slideRight}
      transition={{ duration: 0.35, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden"
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {/* Header */}
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-outfit-var)" }}>
              Sign In
            </h1>
            <div className="secure-badge mt-0.5">
              <Shield className="h-3 w-3" />
              Secure Login
            </div>
          </div>
        </header>

        {/* Spacer — pushes form to middle-bottom zone */}
        <div className="flex-1 min-h-[1.5rem]" />

        {error && (
          <div className="bdcr7-error mb-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="glass-bdcr7 rounded-3xl p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            {/* Email */}
            <div className="bdcr7-input-wrap" data-filled={Boolean(email)}>
              <Mail className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Email / ইমেইল</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bdcr7-input"
                required
                aria-label="Email address"
              />
            </div>

            {/* Password */}
            <div
              className="bdcr7-input-wrap"
              data-filled={Boolean(password)}
              data-error={Boolean(error) && !password}
            >
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Password / পাসওয়ার্ড</label>
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                className="bdcr7-input pr-8"
                required
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
                style={{ minHeight: "unset" }}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {capsLock && (
              <p className="text-[11px]" style={{ color: "rgba(251,189,35,0.8)" }}>
                ⚠ Caps Lock is on
              </p>
            )}

            {/* Options row */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-white/60">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-400"
                  style={{ minHeight: "unset" }}
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-[11px] font-medium transition-colors hover:underline"
                style={{ color: "rgba(251,189,35,0.85)" }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Log In to Account"}
            </button>
          </form>

          <SocialRow onGoogle={onGoogle} loading={loading} />

          <button
            type="button"
            onClick={onOtp}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] transition-colors hover:text-amber-300"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Sign in with OTP instead
          </button>
        </div>

        <p className="mt-3 pb-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          No account?{" "}
          <button
            type="button"
            onClick={onSignup}
            style={{ color: "rgba(251,189,35,0.9)" }}
            className="font-semibold hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
      <DevFooter />
    </motion.main>
  );
}

/* ═══════════════════════════════════════
   VIEW 4 — OTP LOGIN
   ═══════════════════════════════════════ */
interface OtpViewProps {
  onBack: () => void;
  contact: string;
  setContact: (v: string) => void;
  step: 1 | 2;
  digits: string[];
  onDigitInput: (i: number, v: string) => void;
  onDigitKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  digitRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onSend: () => void;
  onVerify: () => void;
  onResend: () => void;
  resendTimer: number;
  loading: boolean;
  error: string;
  success: boolean;
}
function OtpView({
  onBack, contact, setContact, step, digits,
  onDigitInput, onDigitKeyDown, digitRefs,
  onSend, onVerify, onResend, resendTimer, loading, error, success,
}: OtpViewProps) {
  return (
    <motion.main
      key="otp"
      {...slideRight}
      transition={{ duration: 0.35, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden"
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-outfit-var)" }}>
            OTP Login
          </h1>
        </header>

        {/* Spacer — pushes form to middle-bottom zone */}
        <div className="flex-1 min-h-[1.5rem]" />

        <div className="glass-bdcr7 rounded-3xl p-5 space-y-4">
          {error && (
            <div className="bdcr7-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bdcr7-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 bdcr7-check-in" />
              <span>OTP verified! Signing you in...</span>
            </div>
          )}

          {/* STEP 1 */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="otp-step1" {...fadeUp} transition={{ duration: 0.28 }} className="space-y-3">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-outfit-var)" }}>
                  Enter your phone number to receive an OTP
                </p>
                <div className="bdcr7-input-wrap" data-filled={Boolean(contact)}>
                  <Phone className="h-4 w-4 shrink-0 text-amber-300/60" />
                  <label className="bdcr7-input-label">Phone / ফোন নম্বর</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+880 1XXXX XXXXX"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="bdcr7-input"
                    aria-label="Phone number"
                  />
                </div>
                <button
                  type="button"
                  onClick={onSend}
                  disabled={loading || !contact.trim()}
                  className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="otp-step2" {...fadeUp} transition={{ duration: 0.28 }} className="space-y-4">
                <div className="text-center">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Enter the 6-digit code sent to
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-amber-300">{contact}</p>
                </div>

                {/* OTP boxes */}
                <div className="flex items-center justify-center gap-2">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { digitRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={d}
                      onChange={(e) => onDigitInput(i, e.target.value)}
                      onKeyDown={(e) => onDigitKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={`otp-box ${d ? "otp-filled" : ""}`}
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onVerify}
                  disabled={loading || digits.join("").length < 6}
                  className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resendTimer > 0 || loading}
                    className="flex items-center gap-1.5 text-[12px] transition-colors disabled:opacity-40"
                    style={{ color: resendTimer > 0 ? "rgba(255,255,255,0.35)" : "rgba(251,189,35,0.85)" }}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-3 pb-2 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Having trouble?{" "}
          <a href="/forgot-password" style={{ color: "rgba(251,189,35,0.8)" }} className="font-medium hover:underline">
            Try another method
          </a>
        </p>
      </div>
      <DevFooter />
    </motion.main>
  );
}

/* ═══════════════════════════════════════
   VIEW 5 — SIGN UP
   ═══════════════════════════════════════ */
interface SignupViewProps {
  onBack: () => void;
  onGoogle: () => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  fullName: string;
  setFullName: (v: string) => void;
  userId: string;
  setUserId: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPass: string;
  setConfirmPass: (v: string) => void;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  error: string;
  success: boolean;
}
function SignupView({
  onBack, onGoogle, loading, onSubmit,
  fullName, setFullName, userId, setUserId,
  email, setEmail, phone, setPhone,
  password, setPassword, confirmPass, setConfirmPass,
  showPass, setShowPass, showConfirm, setShowConfirm,
  error, success,
}: SignupViewProps) {
  const [emailBlurred, setEmailBlurred] = useState(false);
  const passwordsMatch = Boolean(confirmPass) && password === confirmPass;
  const passwordError = Boolean(password) && password.length < 8;
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const emailError = emailBlurred && Boolean(email) && !isValidEmail(email);
  const canSubmit = !loading && fullName.trim().length > 0 && isValidEmail(email) && password.length >= 8 && passwordsMatch;

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
  };

  return (
    <motion.main
      key="signup"
      {...slideLeft}
      transition={{ duration: 0.35, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden"
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-outfit-var)" }}>
            Create Account
          </h1>
        </header>

        {/* Spacer — pushes form to middle-bottom zone */}
        <div className="flex-[0.4] min-h-[0.5rem]" />

        {error && (
          <div className="bdcr7-error mb-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bdcr7-success mb-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 bdcr7-check-in" />
            <span>Account created! Redirecting...</span>
          </div>
        )}

        <div className="glass-bdcr7 rounded-3xl p-4">
          <form onSubmit={onSubmit} className="space-y-2.5">
            {/* 2-column grid for name + userId */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bdcr7-input-wrap" data-filled={Boolean(fullName)}>
                <User className="h-4 w-4 shrink-0 text-amber-300/60" />
                <label className="bdcr7-input-label bdcr7-input-label-sm">
                  Full Name / <span style={{ fontFamily: "var(--font-hind-var)" }}>নাম</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="bdcr7-input"
                  required
                  aria-label="Full name"
                />
              </div>
              <div className="bdcr7-input-wrap" data-filled={Boolean(userId)}>
                <User className="h-4 w-4 shrink-0 text-amber-300/60" />
                <label className="bdcr7-input-label bdcr7-input-label-sm">User ID</label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="user123"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={loading}
                  className="bdcr7-input"
                  aria-label="User ID"
                />
              </div>
            </div>

            {/* Email */}
            <div className="bdcr7-input-wrap" data-filled={Boolean(email)} data-error={emailError}>
              <Mail className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Email / ইমেইল</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailBlurred(true)}
                disabled={loading}
                className="bdcr7-input"
                required
                aria-label="Email address"
                aria-invalid={emailError}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-rose-300/90">Please enter a valid email address.</p>
            )}

            {/* Phone */}
            <div className="bdcr7-input-wrap" data-filled={Boolean(phone)}>
              <Phone className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Phone / মোবাইল</label>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+880 1XXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                disabled={loading}
                className="bdcr7-input"
                aria-label="Phone number"
              />
            </div>

            {/* Password */}
            <div
              className="bdcr7-input-wrap"
              data-filled={Boolean(password)}
              data-error={passwordError}
              data-success={Boolean(password) && password.length >= 8}
            >
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Password / পাসওয়ার্ড</label>
              <input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bdcr7-input pr-8"
                required
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                disabled={loading}
                style={{ minHeight: "unset" }}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password && <PasswordStrengthMeter password={password} showRequirements />}

            {/* Confirm password */}
            <div
              className="bdcr7-input-wrap"
              data-filled={Boolean(confirmPass)}
              data-error={Boolean(confirmPass) && !passwordsMatch}
              data-success={passwordsMatch}
            >
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Confirm Password</label>
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                disabled={loading}
                className="bdcr7-input pr-8"
                required
                aria-label="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={loading}
                style={{ minHeight: "unset" }}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {confirmPass && (
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium ${
                  passwordsMatch
                    ? "border border-emerald-400/30 bg-emerald-900/15 text-emerald-300"
                    : "border border-rose-400/30 bg-rose-900/15 text-rose-300"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
              </div>
            )}

            <div className="auth-sticky-cta">
              <button
                type="submit"
                disabled={!canSubmit}
                className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Registering..." : "Register Account"}
              </button>
            </div>
          </form>

          <SocialRow onGoogle={onGoogle} loading={loading} />
        </div>

        <p className="mt-3 pb-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBack}
            style={{ color: "rgba(251,189,35,0.9)" }}
            className="font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
      <DevFooter />
    </motion.main>
  );
}

/* ═══════════════════════════════════════
   ROOT — AUTH SPA
   ═══════════════════════════════════════ */
export default function AuthSPA() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const persistedToken = useAuthStore((s) => s.token);
  const persistedUserId = useAuthStore((s) => s.userId);

  const [view, setView] = useState<View>("splash");
  const [showOverlay, setShowOverlay] = useState(false);
  const [authDone, setAuthDone] = useState(false);

  // Splash guard: show splash briefly, check for existing session.
  // If a valid session is found → redirect to dashboard.
  // Otherwise → transition to landing after 1.5 s.
  const persistedTokenRef = useRef(persistedToken);
  useEffect(() => {
    let splashTimer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (persistedTokenRef.current && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/dashboard");
          return;
        }
      }
      splashTimer = setTimeout(() => setView("landing"), 1500);
    };
    void run();
    return () => clearTimeout(splashTimer);
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore theme
  useEffect(() => {
    const stored = localStorage.getItem("bdcr7-theme");
    document.documentElement.classList.toggle("dark", stored !== "light");
  }, []);

  // ─── SIGNIN state ────────────────────────────────────────
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPass, setSiShowPass] = useState(false);
  const [siRemember, setSiRemember] = useState(false);
  const [siCapsLock, setSiCapsLock] = useState(false);
  const [siLoading, setSiLoading] = useState(false);
  const [siError, setSiError] = useState("");

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSiError("");
    setSiLoading(true);
    setShowOverlay(true);
    try {
      await login(siEmail, siPassword);
      setAuthDone(true);
    } catch (err) {
      setSiError((err as Error).message);
      setShowOverlay(false);
      setAuthDone(false);
    } finally {
      setSiLoading(false);
    }
  };

  // ─── SIGNUP state ────────────────────────────────────────
  const [suFullName, setSuFullName] = useState("");
  const [suUserId, setSuUserId] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirmPass, setSuConfirmPass] = useState("");
  const [suShowPass, setSuShowPass] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);
  const [suLoading, setSuLoading] = useState(false);
  const [suError, setSuError] = useState("");
  const [suSuccess, setSuSuccess] = useState(false);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSuError("");
    setSuLoading(true);
    setShowOverlay(true);
    try {
      await register(suEmail, suPassword, suFullName, "viewer");
      setSuSuccess(true);
      setAuthDone(true);
    } catch (err) {
      setSuError((err as Error).message);
      setShowOverlay(false);
      setAuthDone(false);
    } finally {
      setSuLoading(false);
    }
  };

  // ─── OTP state ───────────────────────────────────────────
  const [otpContact, setOtpContact] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpResendTimer <= 0) return;
    const t = setTimeout(() => setOtpResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendTimer]);

  const handleSendOtp = async () => {
    if (!otpContact.trim()) { setOtpError("Enter your phone number"); return; }
    if (!supabase) { setOtpError("Service unavailable"); return; }
    setOtpLoading(true);
    setOtpError("");
    const { error } = await supabase.auth.signInWithOtp({ phone: otpContact.trim() });
    setOtpLoading(false);
    if (error) {
      setOtpError(error.message);
    } else {
      setOtpStep(2);
      setOtpResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleVerifyOtp = async () => {
    const token = otpDigits.join("");
    if (token.length < 6) { setOtpError("Enter all 6 digits"); return; }
    if (!supabase) { setOtpError("Service unavailable"); return; }
    setOtpLoading(true);
    setOtpError("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: otpContact.trim(),
      token,
      type: "sms",
    });
    if (error || !data.session || !data.user) {
      setOtpLoading(false);
      setOtpError(error?.message || "OTP verification failed. Please try again.");
      return;
    }
    const { role: currentRole } = useAuthStore.getState();
    useAuthStore.setState({ token: data.session.access_token, userId: data.user.id, role: currentRole || null });
    // Fetch the user's role so the dashboard can enforce RBAC correctly.
    await useAuthStore.getState().fetchUser().catch(() => {});
    setOtpSuccess(true);
    setShowOverlay(true);
    setAuthDone(true);
    setOtpLoading(false);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otpDigits];
      digits.split("").forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtpDigits(newOtp);
      otpRefs.current[Math.min(index + digits.length - 1, 5)]?.focus();
      return;
    }
    const newOtp = [...otpDigits];
    newOtp[index] = value.replace(/\D/g, "").slice(-1);
    setOtpDigits(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setOtpStep(1);
    setOtpDigits(Array(6).fill(""));
    setOtpError("");
    await handleSendOtp();
  };

  // ─── BIOMETRIC ───────────────────────────────────────────
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [bioState, setBioState] = useState<BiometricState>("idle");

  const handleBiometric = useCallback(async () => {
    setBioLoading(true);
    setBioError("");
    setBioState("scanning");
    try {
      const existingSession = await supabase?.auth.getSession();
      const session = existingSession?.data.session;
      const hasSession = Boolean(persistedToken || session);
      if (!hasSession) {
        setBioError("Sign in with email once first to enable biometric.");
        setBioState("failed");
        setBioLoading(false);
        return;
      }
      const token = persistedToken || session?.access_token;
      const userId = persistedUserId || session?.user?.id;
      const userEmail = session?.user?.email || "bdcr7.user@local";
      if (!token || !userId) {
        setBioError("Session expired. Sign in with email/password first.");
        setBioState("failed");
        setBioLoading(false);
        return;
      }
      await ensureBiometricCredential(token, userId, userEmail);
      await verifyBiometricAssertion(token);
      setBioState("success");
      setShowOverlay(true);
      setAuthDone(true);
    } catch (err) {
      setBioError((err as Error).message || "Biometric failed.");
      setBioState("failed");
    } finally {
      setBioLoading(false);
    }
  }, [persistedToken, persistedUserId]);

  // ─── GOOGLE login ─────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleGoogleSignUp = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <>
      <LoginLoadingOverlay
        visible={showOverlay}
        complete={authDone}
        onDone={() => router.push("/dashboard")}
      />

      <ThemeToggle />

      <div className="auth-bg-bdcr7 login-shell relative">
        {/* animated bg layer */}
        <div className="pointer-events-none absolute inset-0 z-0" />

        <div className="relative z-10 h-full w-full">
          <AnimatePresence mode="wait">
            {view === "splash" && <SplashView key="splash" />}

            {view === "landing" && (() => {
              const goTo = (v: Exclude<View, "landing">) => { setBioState("idle"); setView(v); };
              return (
                <LandingView
                  key="landing"
                  onSignin={() => goTo("signin")}
                  onSignup={() => goTo("signup")}
                  onOtp={() => goTo("otp")}
                  onBiometric={handleBiometric}
                  bioLoading={bioLoading}
                  bioError={bioError}
                  bioState={bioState}
                />
              );
            })()}

            {view === "signin" && (
              <SigninView
                key="signin"
                onBack={() => setView("landing")}
                onSignup={() => setView("signup")}
                onOtp={() => setView("otp")}
                onGoogle={handleGoogleLogin}
                loading={siLoading}
                onSubmit={handleSignIn}
                email={siEmail}
                setEmail={setSiEmail}
                password={siPassword}
                setPassword={setSiPassword}
                showPass={siShowPass}
                setShowPass={setSiShowPass}
                remember={siRemember}
                setRemember={setSiRemember}
                capsLock={siCapsLock}
                setCapsLock={setSiCapsLock}
                error={siError}
              />
            )}

            {view === "signup" && (
              <SignupView
                key="signup"
                onBack={() => setView("landing")}
                onGoogle={handleGoogleSignUp}
                loading={suLoading}
                onSubmit={handleSignUp}
                fullName={suFullName}
                setFullName={setSuFullName}
                userId={suUserId}
                setUserId={setSuUserId}
                email={suEmail}
                setEmail={setSuEmail}
                phone={suPhone}
                setPhone={setSuPhone}
                password={suPassword}
                setPassword={setSuPassword}
                confirmPass={suConfirmPass}
                setConfirmPass={setSuConfirmPass}
                showPass={suShowPass}
                setShowPass={setSuShowPass}
                showConfirm={suShowConfirm}
                setShowConfirm={setSuShowConfirm}
                error={suError}
                success={suSuccess}
              />
            )}

            {view === "otp" && (
              <OtpView
                key="otp"
                onBack={() => { setOtpStep(1); setOtpDigits(Array(6).fill("")); setOtpError(""); setView("landing"); }}
                contact={otpContact}
                setContact={setOtpContact}
                step={otpStep}
                digits={otpDigits}
                onDigitInput={handleOtpInput}
                onDigitKeyDown={handleOtpKeyDown}
                digitRefs={otpRefs}
                onSend={handleSendOtp}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                resendTimer={otpResendTimer}
                loading={otpLoading}
                error={otpError}
                success={otpSuccess}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

