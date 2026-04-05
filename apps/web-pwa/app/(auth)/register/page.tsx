"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader,
  Check,
  AlertCircle,
  Mail,
  Lock,
  User,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { DEVELOPER_CONFIG } from "@/lib/developers";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Validation
  const isFormValid =
    fullName.trim() &&
    email.includes("@") &&
    password.length >= 8 &&
    password === confirmPassword &&
    agreeToTerms;

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please fill in all required fields correctly");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName, "viewer");
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/welcome");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup
  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-shell auth-bg-dark auth-page flex flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <header className="mb-2 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-500/35 bg-slate-900/55 text-slate-200 active:scale-95"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
        </header>

        {error && (
          <div className="mb-2 flex items-start gap-2 rounded-2xl border border-rose-400/45 bg-rose-900/20 px-3 py-2 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border border-emerald-400/45 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
            <Check className="h-4 w-4" />
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        <section className="auth-card rounded-3xl px-3.5 py-3.5">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="auth-input-wrap px-3" data-filled={Boolean(fullName)} data-error={Boolean(error) && !fullName.trim()}>
              <User className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Full Name / পূর্ণ নাম</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="auth-input"
              />
            </div>

            <div className="auth-input-wrap px-3" data-filled={Boolean(email)} data-error={Boolean(error) && !email.includes("@")}>
              <Mail className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Email / ইমেইল</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="auth-input"
              />
            </div>

            <div className="auth-input-wrap px-3" data-filled={Boolean(mobileNumber)}>
              <Smartphone className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Phone / মোবাইল</label>
              <input
                id="mobileNumber"
                type="tel"
                placeholder="+880 1XXXX XXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(formatPhoneNumber(e.target.value))}
                disabled={loading}
                className="auth-input"
              />
            </div>

            <div className="auth-input-wrap px-3" data-filled={Boolean(password)} data-error={Boolean(password) && password.length < 8} data-success={password.length >= 8}>
              <Lock className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Password / পাসওয়ার্ড</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="auth-input pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-300 transition-colors hover:text-white disabled:opacity-70"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password && <PasswordStrengthMeter password={password} showRequirements={true} />}

            <div
              className="auth-input-wrap px-3"
              data-filled={Boolean(confirmPassword)}
              data-error={Boolean(confirmPassword) && password !== confirmPassword}
              data-success={Boolean(confirmPassword) && password === confirmPassword}
            >
              <Lock className="h-4 w-4 shrink-0 text-slate-300" />
              <label className="auth-floating-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="auth-input pr-9"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-300 transition-colors hover:text-white disabled:opacity-70"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {confirmPassword && (
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ${
                  password === confirmPassword
                    ? "border border-emerald-400/40 bg-emerald-900/20 text-emerald-200"
                    : "border border-rose-400/40 bg-rose-900/20 text-rose-200"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
              </div>
            )}

            <label
              htmlFor="terms"
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-500/30 bg-slate-950/35 px-3 py-2"
            >
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-5 w-5 rounded accent-amber-300"
              />
              <span className="text-xs leading-5 text-slate-200/95">I agree to the Terms of Service and Privacy Policy *</span>
            </label>

            <div className="auth-sticky-cta">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="btn-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold disabled:opacity-60"
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : "Register / নিবন্ধন করুন"}
              </button>
            </div>
          </form>

          <div className="my-2.5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-600/40" />
            <span className="text-xs text-slate-300">Or</span>
            <span className="h-px flex-1 bg-slate-600/40" />
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-500/50 bg-slate-900/45 text-sm font-semibold text-slate-100 transition-all hover:bg-slate-800/65 active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <div className="mt-3 border-t border-slate-600/35 pt-2.5 text-center">
            <p className="text-sm font-bold text-white">{DEVELOPER_CONFIG.name}</p>
            <p className="mt-1 text-xs text-slate-300">{DEVELOPER_CONFIG.role}</p>
          </div>
        </section>

        <p className="mt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-300">
          Already have an account?{" "}
          <button onClick={() => router.push("/auth/login")} className="font-semibold text-amber-200 hover:text-amber-100 transition">
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}
