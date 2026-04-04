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
    <main className="login-shell flex flex-col auth-bg-dark safe-bottom overflow-y-auto items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-2xl dark:bg-slate-900/40"
      >
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Forgot Password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            পাসওয়ার্ড ভুলে গেছেন?
          </p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Reset email sent. Check your inbox.
            </p>
            <p className="text-xs text-muted-foreground">
              রিসেট ইমেইল পাঠানো হয়েছে। ইনবক্স চেক করুন।
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Email / ইমেইল
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/90 px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 dark:bg-slate-900/70 transition-all">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send Reset Email / রিসেট পাঠান"}
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login / লগইনে ফিরুন
          </button>
        </div>
      </motion.div>
    </main>
  );
}
