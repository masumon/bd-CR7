"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Fingerprint, Loader2, Lock, MessageSquare, User } from "lucide-react";

import type { BiometricState } from "../types";
import { easeAuth, fadeUp } from "./animations";
import { DevFooter } from "./DevFooter";

type LandingViewProps = {
  onSignin: () => void;
  onSignup: () => void;
  onOtp: () => void;
  onBiometric: () => void;
  bioLoading: boolean;
  bioError: string;
  bioState: BiometricState;
};

export function LandingView({ onSignin, onSignup, onOtp, onBiometric, bioLoading, bioError, bioState }: LandingViewProps) {
  return (
    <motion.main
      key="landing"
      {...fadeUp}
      transition={{ duration: 0.4, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col items-center overflow-hidden px-5"
      style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top))" }}
    >
      <header className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center rounded-full bg-[#0e1f3b] shadow-[0_8px_32px_rgba(0,0,0,0.5)]" style={{ width: 140, height: 140, border: "2.5px solid rgba(251,189,35,0.55)" }}>
          <Image src="/icons/icon.svg" alt="BD CR7" width={110} height={110} className="object-contain" style={{ width: 110, height: 110 }} />
        </div>
        <p className="text-2xl font-bold tracking-widest" style={{ fontFamily: "var(--font-outfit-var)", color: "var(--bdcr7-gold)" }}>
          BD CR7
        </p>
      </header>

      <h2 className="mt-6 text-center text-4xl font-extrabold text-white" style={{ fontFamily: "var(--font-outfit-var)", letterSpacing: "-0.01em" }}>
        স্বাগতম ফিরে এলেন
      </h2>

      <div className="flex-1" />

      <div className="w-full max-w-sm space-y-3">
        <button type="button" onClick={onSignup} className="btn-bdcr7-outline flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold" aria-label="নতুন একাউন্ট খুলুন">
          <User className="h-5 w-5" />
          নতুন একাউন্ট / <span style={{ fontFamily: "var(--font-hind-var)" }}>Sign Up</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.1]" />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>অথবা</span>
          <span className="h-px flex-1 bg-white/[0.1]" />
        </div>

        <button type="button" onClick={onOtp} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/80 transition-all hover:bg-white/[0.07] hover:border-amber-300/25 active:scale-[0.97]" style={{ height: "52px" }} aria-label="ওটিপি দিয়ে লগইন">
          <MessageSquare className="h-5 w-5 text-amber-300/70" />
          ওটিপি দিয়ে লগইন
        </button>

        <button type="button" onClick={onSignin} className="btn-bdcr7-gold flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base" aria-label="লগইন করুন">
          <Lock className="h-5 w-5" />
          লগইন / <span style={{ fontFamily: "var(--font-hind-var)" }}>Sign In</span>
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex w-full max-w-sm flex-col items-center gap-2 pb-3">
        {bioError && bioState !== "failed" && <p className="max-w-[250px] text-center text-[11px] leading-5 text-rose-300/90">{bioError}</p>}

        <AnimatePresence mode="wait">
          {bioState === "success" ? (
            <motion.div key="bio-success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="flex flex-col items-center gap-1">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-[11px] text-emerald-300">বায়োমেট্রিক যাচাই সম্পন্ন!</p>
            </motion.div>
          ) : (
            <motion.div key="bio-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <div className="fingerprint-ring relative flex items-center justify-center rounded-full border-2 transition-colors" style={{ width: 100, height: 100, borderColor: bioState === "scanning" ? "rgba(251,189,35,0.7)" : bioState === "failed" ? "rgba(248,113,113,0.5)" : "rgba(251,189,35,0.4)" }}>
                {bioState === "scanning" && <div className="fingerprint-scan-line" />}
                <button type="button" onClick={onBiometric} disabled={bioLoading} aria-label="Tap to scan fingerprint" className="biometric-hero-btn flex items-center justify-center rounded-full" style={{ width: 78, height: 78 }}>
                  {bioState === "scanning" ? <Loader2 className="h-7 w-7 animate-spin text-amber-200/80" /> : <Fingerprint style={{ width: "46%", height: "46%" }} className={bioState === "failed" ? "text-rose-300/80" : "text-amber-200/90"} />}
                </button>
              </div>

              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.52)" }}>
                {bioState === "scanning" ? "স্ক্যান হচ্ছে..." : bioState === "failed" ? "বায়োমেট্রিক যাচাই ব্যর্থ" : "স্ক্যান করতে চাপ দিন"}
              </p>

              {bioState === "failed" && (
                <button type="button" onClick={onSignin} className="text-[11px] font-medium transition-colors hover:underline" style={{ color: "rgba(251,189,35,0.85)" }}>
                  পাসওয়ার্ড দিয়ে লগইন করুন
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DevFooter />
    </motion.main>
  );
}
