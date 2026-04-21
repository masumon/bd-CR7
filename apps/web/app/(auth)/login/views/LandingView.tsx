"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2, ChevronDown, ChevronUp,
  Fingerprint, Loader2, Lock, Mail, Phone, Shield, User,
} from "lucide-react";

import type { BiometricState } from "../types";
import { easeAuth, fadeUp } from "./animations";
import { DevFooter } from "./DevFooter";

type LandingViewProps = {
  onSignin: () => void;
  onSignup: () => void;
  onEmailOtp: () => void;
  onBiometric: () => void;
  onPin: () => void;
  onPasskey: () => void;
  passkeyLoading: boolean;
  passkeyError: string;
  bioLoading: boolean;
  bioError: string;
  bioState: BiometricState;
  showBiometric: boolean;
  showPin: boolean;
  rememberedEmail: string;
  securityHint: string;
};

export function LandingView({
  onSignin, onSignup, onEmailOtp, onBiometric, onPin, onPasskey,
  passkeyLoading, passkeyError, bioLoading, bioError, bioState,
  showBiometric, showPin, rememberedEmail, securityHint,
}: LandingViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <motion.main
      key="landing"
      {...fadeUp}
      transition={{ duration: 0.4, ease: easeAuth }}
      className="auth-flow-screen items-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))]"
    >
      {/* ── Brand ── */}
      <header className="flex flex-col items-center gap-3">
        <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-[2.5px] border-amber-300/55 bg-[#0e1f3b] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Image src="/icons/icon.svg" alt="BD CR7" width={94} height={94} className="h-[94px] w-[94px] object-contain" />
        </div>
        <p className="font-[var(--font-outfit-var)] text-2xl font-bold tracking-widest text-[var(--bdcr7-gold)]">
          BD CR7
        </p>
      </header>

      <h2 className="mt-5 text-center font-[var(--font-outfit-var)] text-3xl font-extrabold tracking-[-0.01em] text-foreground">
        স্বাগতম
      </h2>
      <p className="mt-1 text-center text-[13px] text-muted-foreground">
        আপনার ফোন নম্বর দিয়ে লগইন করুন
      </p>

      <div className="flex-1 min-h-[1rem]" />

      {/* ── PRIMARY: Phone + OTP ── */}
      <div className="w-full max-w-sm space-y-3">

        {showBiometric ? (
          <div className="flex flex-col items-center gap-2 pb-1">
            <AnimatePresence mode="wait">
              {bioState === "success" ? (
                <motion.div key="bio-success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="text-[11px] text-emerald-300">বায়োমেট্রিক সম্পন্ন!</p>
                </motion.div>
              ) : (
                <motion.div key="bio-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1.5">
                  <div className={`fingerprint-ring relative flex h-[84px] w-[84px] items-center justify-center rounded-full border-2 transition-colors ${bioState === "scanning" ? "border-amber-300/70" : bioState === "failed" ? "border-rose-400/50" : "border-amber-300/40"}`}>
                    {bioState === "scanning" && <div className="fingerprint-scan-line" />}
                    <button type="button" onClick={onBiometric} disabled={bioLoading} aria-label="আঙুলের ছাপ স্ক্যান করুন" className="biometric-hero-btn flex h-[66px] w-[66px] items-center justify-center rounded-full">
                      {bioState === "scanning" ? <Loader2 className="h-6 w-6 animate-spin text-amber-200/80" /> : <Fingerprint className={`h-[44%] w-[44%] ${bioState === "failed" ? "text-rose-300/80" : "text-amber-200/90"}`} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {bioState === "scanning" ? "স্ক্যান হচ্ছে..." : bioState === "failed" ? "বায়োমেট্রিক ব্যর্থ" : "আঙুল রাখুন"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}

        {rememberedEmail ? <p className="text-center text-[11px] text-muted-foreground">Trusted account: {rememberedEmail}</p> : null}
        {securityHint ? <p className="text-center text-[11px] text-muted-foreground">{securityHint}</p> : null}

        {/* Primary CTA: OTP (Phone / Email) */}
        <button
          type="button"
          onClick={onEmailOtp}
          className="btn-bdcr7-gold flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base"
          aria-label="OTP দিয়ে প্রবেশ করুন"
        >
          <Phone className="h-5 w-5" />
          OTP দিয়ে প্রবেশ করুন
        </button>

        {/* Secondary: Passkey */}
        {showBiometric ? (
          <button
            type="button"
            onClick={onPasskey}
            disabled={passkeyLoading}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card active:scale-[0.97] disabled:opacity-60"
            aria-label="বায়োমেট্রিক দিয়ে প্রবেশ করুন"
          >
            {passkeyLoading ? <Loader2 className="h-5 w-5 animate-spin text-amber-300/80" /> : <Shield className="h-5 w-5 text-amber-300/70" />}
            Face / Fingerprint দিয়ে প্রবেশ করুন
          </button>
        ) : null}

        {showPin ? (
          <button
            type="button"
            onClick={onPin}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card active:scale-[0.97]"
            aria-label="পিন দিয়ে প্রবেশ করুন"
          >
            <Lock className="h-5 w-5 text-amber-300/70" />
            PIN দিয়ে প্রবেশ করুন
          </button>
        ) : null}

        {/* Error display */}
        {(passkeyError || (bioError && bioState !== "failed")) && (
          <p className="text-center text-[11px] leading-5 text-rose-300/90">{passkeyError || bioError}</p>
        )}

        {/* Advanced options disclosure */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAdvanced ? "লুকাও" : "অন্যান্য অপশন"}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                key="advanced"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={onSignin}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/40 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground active:scale-[0.97]"
                    aria-label="ইমেইল ও পাসওয়ার্ড দিয়ে লগইন"
                  >
                    <Lock className="h-4 w-4" />
                    ইমেইল + পাসওয়ার্ড
                  </button>

                  <button
                    type="button"
                    onClick={onSignup}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/40 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground active:scale-[0.97]"
                    aria-label="নতুন অ্যাকাউন্ট তৈরি করুন"
                  >
                    <User className="h-4 w-4" />
                    নতুন অ্যাকাউন্ট
                  </button>

                  <button
                    type="button"
                    onClick={onEmailOtp}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    ইমেইল OTP ফলব্যাক
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1" />
      <DevFooter />
    </motion.main>
  );
}
