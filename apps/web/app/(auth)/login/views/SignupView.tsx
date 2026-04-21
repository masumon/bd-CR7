"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";

import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

import { easeAuth, slideLeft } from "./animations";
import { DevFooter } from "./DevFooter";
import { SocialRow } from "./SocialRow";

type SignupViewProps = {
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
};

export function SignupView({
  onBack,
  onGoogle,
  loading,
  onSubmit,
  fullName,
  setFullName,
  userId,
  setUserId,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPass,
  setConfirmPass,
  showPass,
  setShowPass,
  showConfirm,
  setShowConfirm,
  error,
  success,
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
    <motion.main key="signup" {...slideLeft} transition={{ duration: 0.35, ease: easeAuth }} className="auth-flow-screen">
      <div className="auth-flow-container">
        <header className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="back-btn-bdcr7" aria-label="পিছনে যান">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-[var(--font-outfit-var)] text-xl font-bold text-foreground">
            নতুন একাউন্ট তৈরি করুন
          </h1>
        </header>

        <div className="flex-[0.4] min-h-[0.5rem]" />

        {error && <div className="bdcr7-error mb-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        {success && <div className="bdcr7-success mb-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 bdcr7-check-in" /><span>একাউন্ট তৈরি হয়েছে! রিডাইরেক্ট করা হচ্ছে...</span></div>}

        <div className="glass-bdcr7 rounded-3xl p-4">
          <form onSubmit={onSubmit} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bdcr7-input-wrap" data-filled={Boolean(fullName)}>
                <User className="h-4 w-4 shrink-0 text-amber-300/60" />
                <label className="bdcr7-input-label bdcr7-input-label-sm">Full Name / <span className="font-[var(--font-hind-var)]">নাম</span></label>
                <input type="text" autoComplete="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} className="bdcr7-input app-field" required aria-label="Full name" />
              </div>
              <div className="bdcr7-input-wrap" data-filled={Boolean(userId)}>
                <User className="h-4 w-4 shrink-0 text-amber-300/60" />
                <label className="bdcr7-input-label bdcr7-input-label-sm">ইউজার আইডি</label>
                <input type="text" autoComplete="username" placeholder="user123" value={userId} onChange={(e) => setUserId(e.target.value)} disabled={loading} className="bdcr7-input app-field" aria-label="User ID" />
              </div>
            </div>

            <div className="bdcr7-input-wrap" data-filled={Boolean(email)} data-error={emailError}>
              <Mail className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Email / ইমেইল</label>
              <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailBlurred(true)} disabled={loading} className="bdcr7-input app-field" required aria-label="Email address" />
            </div>
            {emailError && <p className="text-[11px] text-rose-300/90">সঠিক ইমেইল ঠিকানা লিখুন।</p>}

            <div className="bdcr7-input-wrap" data-filled={Boolean(phone)}>
              <Phone className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Phone / মোবাইল</label>
              <input type="tel" autoComplete="tel" placeholder="+880 1XXX XXXXX" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} disabled={loading} className="bdcr7-input app-field" aria-label="Phone number" />
            </div>

            <div className="bdcr7-input-wrap" data-filled={Boolean(password)} data-error={passwordError} data-success={Boolean(password) && password.length >= 8}>
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Password / পাসওয়ার্ড</label>
              <input type={showPass ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="bdcr7-input app-field pr-8" required aria-label="Password" />
              <button type="button" onClick={() => setShowPass(!showPass)} disabled={loading} className="min-h-0 shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password && <PasswordStrengthMeter password={password} showRequirements />}

            <div className="bdcr7-input-wrap" data-filled={Boolean(confirmPass)} data-error={Boolean(confirmPass) && !passwordsMatch} data-success={passwordsMatch}>
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">পাসওয়ার্ড নিশ্চিত করুন</label>
              <input type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} disabled={loading} className="bdcr7-input app-field pr-8" required aria-label="পাসওয়ার্ড নিশ্চিত করুন" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} disabled={loading} className="min-h-0 shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {confirmPass && (
              <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium ${passwordsMatch ? "border border-emerald-400/30 bg-emerald-900/15 text-emerald-300" : "border border-rose-400/30 bg-rose-900/15 text-rose-300"}`}>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {passwordsMatch ? "পাসওয়ার্ড মিলেছে ✓" : "পাসওয়ার্ড মিলছে না"}
              </div>
            )}

            <div className="auth-sticky-cta">
              <button type="submit" disabled={!canSubmit} className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
              </button>
            </div>
          </form>

          <SocialRow onGoogle={onGoogle} loading={loading} />
        </div>

        <p className="mt-3 pb-2 text-center text-xs text-muted-foreground">
          আগে থেকেই অ্যাকাউন্ট আছে? <button type="button" onClick={onBack} className="font-semibold text-primary hover:underline">লগইন করুন</button>
        </p>
      </div>
      <DevFooter />
    </motion.main>
  );
}
