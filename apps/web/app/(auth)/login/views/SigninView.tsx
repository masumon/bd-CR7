"use client";

import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronLeft, Eye, EyeOff, Loader2, Lock, Mail, Shield, ShieldCheck } from "lucide-react";

import { easeAuth, slideRight } from "./animations";
import { DevFooter } from "./DevFooter";
import { SocialRow } from "./SocialRow";

type SigninViewProps = {
  onBack: () => void;
  onSignup: () => void;
  onEmailOtp: () => void;
  onPasskey: () => void;
  onPin: () => void;
  onGoogle: () => void;
  loading: boolean;
  passkeyLoading: boolean;
  pinAvailable: boolean;
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
  passkeyError: string;
};

export function SigninView({
  onBack,
  onSignup,
  onEmailOtp,
  onPasskey,
  onPin,
  onGoogle,
  loading,
  passkeyLoading,
  pinAvailable,
  onSubmit,
  email,
  setEmail,
  password,
  setPassword,
  showPass,
  setShowPass,
  remember,
  setRemember,
  capsLock,
  setCapsLock,
  error,
  passkeyError,
}: SigninViewProps) {
  return (
    <motion.main key="signin" {...slideRight} transition={{ duration: 0.35, ease: easeAuth }} className="flex min-h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-[var(--font-outfit-var)] text-2xl font-bold text-foreground">Welcome Back</h1>
            <div className="secure-badge mt-0.5"><Shield className="h-3 w-3" />Secure Sign In</div>
          </div>
        </header>

        <div className="flex-1 min-h-[1.5rem]" />

        {(error || passkeyError) && <div className="bdcr7-error mb-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{passkeyError || error}</span></div>}

        <div className="glass-bdcr7 rounded-3xl p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="bdcr7-input-wrap" data-filled={Boolean(email)}>
              <Mail className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Email</label>
              <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bdcr7-input" required aria-label="Email address" />
            </div>

            <div className="bdcr7-input-wrap" data-filled={Boolean(password)} data-error={Boolean(error) && !password}>
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Password</label>
              <input type={showPass ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))} className="bdcr7-input pr-8" required aria-label="Password" />
              <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Hide password" : "Show password"} className="min-h-0 shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {capsLock && <p className="text-[11px] text-amber-300/80">⚠ Caps Lock is on</p>}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 min-h-0 rounded accent-amber-400" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-[11px] font-medium text-amber-300/90 transition-colors hover:underline">
                Forgot password?
              </a>
            </div>

            <button type="submit" disabled={loading} className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <SocialRow onGoogle={onGoogle} loading={loading} />

          <button type="button" onClick={onPasskey} disabled={passkeyLoading || !email.trim()} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50">
            {passkeyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Sign in with Face / Fingerprint
          </button>

          {pinAvailable ? (
            <button type="button" onClick={onPin} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <Lock className="h-3.5 w-3.5" />
              Sign in with PIN
            </button>
          ) : null}

          <button type="button" onClick={onEmailOtp} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] text-muted-foreground transition-colors hover:text-primary">
            <Mail className="h-3.5 w-3.5" />
            Use Email OTP fallback
          </button>
        </div>

        <p className="mt-3 pb-2 text-center text-xs text-muted-foreground">
          No account? <button type="button" onClick={onSignup} className="font-semibold text-amber-300/90 hover:underline">Create one</button>
        </p>
      </div>
      <DevFooter />
    </motion.main>
  );
}
