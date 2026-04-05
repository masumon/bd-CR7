"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

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

  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword;

  return (
    <main className="register-shell auth-bg-bdcr7 flex flex-col overflow-y-auto">
      <div
        className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <header className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="back-btn-bdcr7"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1
              className="text-xl font-bold text-white"
              style={{ fontFamily: "var(--font-outfit-var)" }}
            >
              Create Account
            </h1>
            <div className="secure-badge mt-0.5">
              <Shield className="h-3 w-3" />
              Secure Registration
            </div>
          </div>
        </header>

        {error && (
          <div className="bdcr7-error mb-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bdcr7-success mb-3">
            <Check className="h-4 w-4 shrink-0" />
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        <section className="glass-bdcr7 rounded-3xl px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="bdcr7-input-wrap" data-filled={Boolean(fullName)} data-error={Boolean(error) && !fullName.trim()}>
              <User className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Full Name / পূর্ণ নাম</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="bdcr7-input"
                required
                aria-label="Full name"
              />
            </div>

            <div className="bdcr7-input-wrap" data-filled={Boolean(email)} data-error={Boolean(email) && !email.includes("@")}>
              <Mail className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Email / ইমেইল</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bdcr7-input"
                required
                aria-label="Email address"
              />
            </div>

            <div className="bdcr7-input-wrap" data-filled={Boolean(mobileNumber)}>
              <Phone className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Phone / মোবাইল</label>
              <input
                id="mobileNumber"
                type="tel"
                placeholder="+880 1XXXX XXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(formatPhoneNumber(e.target.value))}
                disabled={loading}
                className="bdcr7-input"
                aria-label="Phone number"
              />
            </div>

            <div
              className="bdcr7-input-wrap"
              data-filled={Boolean(password)}
              data-error={Boolean(password) && password.length < 8}
              data-success={password.length >= 8}
            >
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Password / পাসওয়ার্ড</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bdcr7-input pr-8"
                required
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ minHeight: "unset" }}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password && <PasswordStrengthMeter password={password} showRequirements={true} />}

            <div
              className="bdcr7-input-wrap"
              data-filled={Boolean(confirmPassword)}
              data-error={Boolean(confirmPassword) && password !== confirmPassword}
              data-success={passwordsMatch}
            >
              <Lock className="h-4 w-4 shrink-0 text-amber-300/60" />
              <label className="bdcr7-input-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="bdcr7-input pr-8"
                required
                aria-label="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ minHeight: "unset" }}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {confirmPassword && (
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium ${
                  passwordsMatch
                    ? "border border-emerald-400/30 bg-emerald-900/15 text-emerald-300"
                    : "border border-rose-400/30 bg-rose-900/15 text-rose-300"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
              </div>
            )}

            <label
              htmlFor="terms"
              className="flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2"
              style={{ borderColor: "rgba(251,189,35,0.15)", background: "rgba(255,255,255,0.03)" }}
            >
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-5 w-5 rounded accent-amber-400"
                style={{ minHeight: "unset" }}
              />
              <span className="text-xs leading-5" style={{ color: "rgba(255,255,255,0.75)" }}>
                I agree to the Terms of Service and Privacy Policy *
              </span>
            </label>

            <div className="auth-sticky-cta">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="btn-bdcr7-gold flex h-12 w-full items-center justify-center gap-2 rounded-2xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Registering..." : "Register Account"}
              </button>
            </div>
          </form>

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Or</span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-60"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </section>

        <p
          className="mt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-xs"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            style={{ color: "rgba(251,189,35,0.9)" }}
            className="font-semibold hover:underline transition"
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}
