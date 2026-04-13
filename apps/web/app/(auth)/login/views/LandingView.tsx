"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Fingerprint, Loader2, Lock, Mail, Shield, User } from "lucide-react";

import type { BiometricState } from "../types";
import { easeAuth, fadeUp } from "./animations";
import { DevFooter } from "./DevFooter";

type LandingViewProps = {
  onSignin: () => void;
  onSignup: () => void;
  onEmailOtp: () => void;
  onBiometric: () => void;
  onPasskey: () => void;
  passkeyLoading: boolean;
  passkeyError: string;
  bioLoading: boolean;
  bioError: string;
  bioState: BiometricState;
};

export function LandingView({ onSignin, onSignup, onEmailOtp, onBiometric, onPasskey, passkeyLoading, passkeyError, bioLoading, bioError, bioState }: LandingViewProps) {
  return (
    <motion.main
      key="landing"
      {...fadeUp}
      transition={{ duration: 0.4, ease: easeAuth }}
      className="flex min-h-[100dvh] w-full flex-col items-center overflow-y-auto overflow-x-hidden px-5 pt-[max(2.5rem,env(safe-area-inset-top))]"
    >
      <header className="flex flex-col items-center gap-3">
        <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full border-[2.5px] border-amber-300/55 bg-[#0e1f3b] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Image src="/icons/icon.svg" alt="BD CR7" width={110} height={110} className="h-[110px] w-[110px] object-contain" />
        </div>
        <p className="font-[var(--font-outfit-var)] text-2xl font-bold tracking-widest text-[var(--bdcr7-gold)]">
          BD CR7
        </p>
      </header>

      <h2 className="mt-6 text-center font-[var(--font-outfit-var)] text-4xl font-extrabold tracking-[-0.01em] text-foreground">
        Welcome Back
      </h2>

      <div className="flex-1" />

      <div className="w-full max-w-sm space-y-3">
        <button type="button" onClick={onSignup} className="btn-bdcr7-outline flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold" aria-label="Create account">
          <User className="h-5 w-5" />
          Sign Up
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border/70" />
          <span className="text-[11px] text-muted-foreground">OR</span>
          <span className="h-px flex-1 bg-border/70" />
        </div>

        <button type="button" onClick={onPasskey} disabled={passkeyLoading} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card active:scale-[0.97] disabled:opacity-60" aria-label="Sign in with passkey">
          {passkeyLoading ? <Loader2 className="h-5 w-5 animate-spin text-amber-300/80" /> : <Shield className="h-5 w-5 text-amber-300/70" />}
          Continue with Passkey
        </button>

        <button type="button" onClick={onSignin} className="btn-bdcr7-gold flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base" aria-label="Sign in">
          <Lock className="h-5 w-5" />
          Sign In
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex w-full max-w-sm flex-col items-center gap-2 pb-3">
        {(passkeyError || (bioError && bioState !== "failed")) && <p className="max-w-[250px] text-center text-[11px] leading-5 text-rose-300/90">{passkeyError || bioError}</p>}

        <AnimatePresence mode="wait">
          {bioState === "success" ? (
            <motion.div key="bio-success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="flex flex-col items-center gap-1">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-[11px] text-emerald-300">Biometric verification complete!</p>
            </motion.div>
          ) : (
            <motion.div key="bio-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <div className={`fingerprint-ring relative flex h-[100px] w-[100px] items-center justify-center rounded-full border-2 transition-colors ${bioState === "scanning" ? "border-amber-300/70" : bioState === "failed" ? "border-rose-400/50" : "border-amber-300/40"}`}>
                {bioState === "scanning" && <div className="fingerprint-scan-line" />}
                <button type="button" onClick={onBiometric} disabled={bioLoading} aria-label="Tap to scan fingerprint" className="biometric-hero-btn flex h-[78px] w-[78px] items-center justify-center rounded-full">
                  {bioState === "scanning" ? <Loader2 className="h-7 w-7 animate-spin text-amber-200/80" /> : <Fingerprint className={`h-[46%] w-[46%] ${bioState === "failed" ? "text-rose-300/80" : "text-amber-200/90"}`} />}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {bioState === "scanning" ? "Scanning..." : bioState === "failed" ? "Biometric verification failed" : "Tap to scan"}
              </p>

              {bioState === "failed" && (
                <button type="button" onClick={onSignin} className="text-[11px] font-medium text-amber-300/90 transition-colors hover:underline">
                  Use password sign in
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="button" onClick={onEmailOtp} className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary">
          <Mail className="h-3.5 w-3.5" />
          Use Email OTP fallback
        </button>
      </div>

      <DevFooter />
    </motion.main>
  );
}
