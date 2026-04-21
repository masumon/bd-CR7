"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ChevronLeft, Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PoweredByFooter } from "@/components/auth/PoweredByFooter";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!supabase) {
      setError("Service unavailable. Please try again later.");
      return;
    }
    setLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login")}`,
    });
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setSent(true);
    }
  };

  return (
    <main className="auth-bg-bdcr7 login-shell flex min-h-[100dvh] flex-col items-center justify-between overflow-y-auto overflow-x-hidden px-5 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 w-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="glass-bdcr7 w-full max-w-sm rounded-3xl px-5 py-6"
      >
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="secure-badge mb-2 justify-center">
            <Shield className="h-3.5 w-3.5" />
            Secure Reset
          </div>
          <h1 className="font-[var(--font-outfit-var)] text-2xl font-bold tracking-tight text-white">
            Forgot Password
          </h1>
          <p className="mt-1 font-[var(--font-hind-var)] text-xs text-white/45">
            পাসওয়ার্ড ভুলে গেছেন?
          </p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.4 }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <div className="bdcr7-check-in">
              <CheckCircle className="h-14 w-14 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-300">
              Reset email sent. Check your inbox.
            </p>
            <p className="font-[var(--font-hind-var)] text-xs text-white/45">
              রিসেট ইমেইল পাঠানো হয়েছে। ইনবক্স চেক করুন।
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bdcr7-error">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="btn-bdcr7-gold flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send Reset Email / রিসেট পাঠান"}
            </button>
          </form>
        )}

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70 hover:underline"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Login / লগইনে ফিরুন
          </button>
        </div>
      </motion.div>
      </div>
      <PoweredByFooter />
    </main>
  );
}
