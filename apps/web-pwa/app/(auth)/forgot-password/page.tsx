"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setSent(true);
    }
  };

  return (
    <main className="login-shell auth-bg-dark flex h-[100dvh] items-center justify-center overflow-hidden px-5">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="auth-card w-full max-w-sm rounded-3xl px-5 py-6"
      >
        <div className="mb-5 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Forgot Password
          </h1>
          <p className="mt-1 text-xs text-white/52">পাসওয়ার্ড ভুলে গেছেন?</p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <CheckCircle className="h-12 w-12 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">
              Reset email sent. Check your inbox.
            </p>
            <p className="text-xs text-white/50">
              রিসেট ইমেইল পাঠানো হয়েছে। ইনবক্স চেক করুন।
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-900/20 px-3 py-2.5 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="auth-input-wrap px-3" data-filled={Boolean(email)}>
              <Mail className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Email / ইমেইল</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold disabled:opacity-60"
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
            className="flex items-center gap-1.5 text-xs text-white/42 transition-colors hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login / লগইনে ফিরুন
          </button>
        </div>
      </motion.div>
    </main>
  );
}
