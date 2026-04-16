"use client";

import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronLeft, Loader2, Lock, Mail, Shield } from "lucide-react";

import { easeAuth, slideRight } from "./animations";
import { DevFooter } from "./DevFooter";

type PinViewProps = {
  onBack: () => void;
  onPassword: () => void;
  onEmailOtp: () => void;
  onSubmit: (event: FormEvent) => void;
  loading: boolean;
  error: string;
  email: string;
  setEmail: (value: string) => void;
  pin: string;
  setPin: (value: string) => void;
};

export function PinView({ onBack, onPassword, onEmailOtp, onSubmit, loading, error, email, setEmail, pin, setPin }: PinViewProps) {
  return (
    <motion.main key="pin" {...slideRight} transition={{ duration: 0.35, ease: easeAuth }} className="flex min-h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-[var(--font-outfit-var)] text-2xl font-bold text-foreground">Trusted Device PIN</h1>
            <div className="secure-badge mt-0.5"><Shield className="h-3 w-3" />PIN Sign In</div>
          </div>
        </header>

        <div className="flex-1 min-h-[1.5rem]" />

        {error ? <div className="bdcr7-error mb-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}

        <div className="glass-bdcr7 rounded-3xl p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="bdcr7-input-wrap" data-filled={Boolean(email)}>
              <Mail className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Email</label>
              <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className="bdcr7-input" required aria-label="Email address" />
            </div>

            <div className="bdcr7-input-wrap" data-filled={Boolean(pin)}>
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">PIN</label>
              <input type="password" inputMode="numeric" autoComplete="off" placeholder="4-8 digits" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))} className="bdcr7-input" required aria-label="Trusted device PIN" />
            </div>

            <button type="submit" disabled={loading || pin.length < 4} className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loading ? "Verifying PIN..." : "Sign In with PIN"}
            </button>
          </form>

          <button type="button" onClick={onPassword} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
            <Lock className="h-3.5 w-3.5" />
            Use password instead
          </button>

          <button type="button" onClick={onEmailOtp} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] text-muted-foreground transition-colors hover:text-primary">
            <Mail className="h-3.5 w-3.5" />
            Use Email OTP fallback
          </button>
        </div>
      </div>
      <DevFooter />
    </motion.main>
  );
}