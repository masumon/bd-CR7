"use client";

import type { MutableRefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, MessageSquare, Phone, RefreshCcw } from "lucide-react";

import { easeAuth, fadeUp, slideRight } from "./animations";
import { DevFooter } from "./DevFooter";

type OtpViewProps = {
  onBack: () => void;
  contact: string;
  setContact: (v: string) => void;
  step: 1 | 2;
  digits: string[];
  onDigitInput: (i: number, v: string) => void;
  onDigitKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  digitRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  onSend: () => void;
  onVerify: () => void;
  onResend: () => void;
  resendTimer: number;
  loading: boolean;
  error: string;
  success: boolean;
};

export function OtpView({
  onBack,
  contact,
  setContact,
  step,
  digits,
  onDigitInput,
  onDigitKeyDown,
  digitRefs,
  onSend,
  onVerify,
  onResend,
  resendTimer,
  loading,
  error,
  success,
}: OtpViewProps) {
  return (
    <motion.main key="otp" {...slideRight} transition={{ duration: 0.35, ease: easeAuth }} className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="Go back"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-outfit-var)" }}>ওটিপি লগইন</h1>
        </header>

        <div className="flex-1 min-h-[1.5rem]" />

        <div className="glass-bdcr7 rounded-3xl p-5 space-y-4">
          {error && <div className="bdcr7-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          {success && <div className="bdcr7-success"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 bdcr7-check-in" /><span>ওটিপি যাচাই সম্পন্ন! লগইন করা হচ্ছে...</span></div>}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="otp-step1" {...fadeUp} transition={{ duration: 0.28 }} className="space-y-3">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-outfit-var)" }}>ওটিপি পেতে আপনার ফোন নম্বর লিখুন</p>
                <div className="bdcr7-input-wrap" data-filled={Boolean(contact)}>
                  <Phone className="h-4 w-4 shrink-0 text-amber-300/60" />
                  <label className="bdcr7-input-label">Phone / ফোন নম্বর</label>
                  <input type="tel" autoComplete="tel" placeholder="+880 1XXXX XXXXX" value={contact} onChange={(e) => setContact(e.target.value)} className="bdcr7-input" aria-label="Phone number" />
                </div>
                <button type="button" onClick={onSend} disabled={loading || !contact.trim()} className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  {loading ? "ওটিপি পাঠানো হচ্ছে..." : "ওটিপি পাঠান"}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="otp-step2" {...fadeUp} transition={{ duration: 0.28 }} className="space-y-4">
                <div className="text-center">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>নিচে পাঠানো ৬ সংখ্যার কোড লিখুন</p>
                  <p className="mt-0.5 text-sm font-semibold text-amber-300">{contact}</p>
                </div>

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
                      aria-label={`ওটিপি ডিজিট ${i + 1}`}
                    />
                  ))}
                </div>

                <button type="button" onClick={onVerify} disabled={loading || digits.join("").length < 6} className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {loading ? "যাচাই হচ্ছে..." : "ওটিপি যাচাই করুন"}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <button type="button" onClick={onResend} disabled={resendTimer > 0 || loading} className="flex items-center gap-1.5 text-[12px] transition-colors disabled:opacity-40" style={{ color: resendTimer > 0 ? "rgba(255,255,255,0.35)" : "rgba(251,189,35,0.85)" }}>
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {resendTimer > 0 ? `${resendTimer} সেকেন্ড পর আবার পাঠান` : "আবার ওটিপি পাঠান"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-3 pb-2 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          সমস্যা হচ্ছে? <a href="/forgot-password" style={{ color: "rgba(251,189,35,0.8)" }} className="font-medium hover:underline">অন্য পদ্ধতি ব্যবহার করুন</a>
        </p>
      </div>
      <DevFooter />
    </motion.main>
  );
}
