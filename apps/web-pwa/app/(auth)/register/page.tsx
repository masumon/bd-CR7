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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialLinks } from "@/components/auth/SocialLinks";
import { AuthLayout, AuthCard } from "@/components/auth/AuthLayout";
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

  return (
    <AuthLayout variant="form" maxWidth="sm">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="p-0 h-auto w-auto hover:bg-transparent"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground/70" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display flex-1">
          Create Account
        </h1>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="
            flex items-start gap-3
            p-3 sm:p-4
            rounded-lg
            bg-red-50 border border-red-200
            text-red-700 text-sm
            animate-slide-down
          "
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          className="
            flex items-center justify-center gap-2
            p-3 sm:p-4
            rounded-lg
            bg-green-50 border border-green-200
            text-green-700 text-sm
            animate-slide-down
          "
        >
          <Check className="w-4 h-4" />
          <span>Account created successfully! Redirecting...</span>
        </div>
      )}

      {/* Registration Form */}
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-xs font-medium text-foreground/70">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="
                  w-full
                  pl-10 pr-4 py-2.5 sm:py-3
                  rounded-lg
                  bg-white/80 border border-border/60
                  text-foreground
                  text-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                  transition-all duration-200
                  disabled:opacity-70
                "
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-medium text-foreground/70">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="
                  w-full
                  pl-10 pr-4 py-2.5 sm:py-3
                  rounded-lg
                  bg-white/80 border border-border/60
                  text-foreground
                  text-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                  transition-all duration-200
                  disabled:opacity-70
                "
              />
            </div>
          </div>

          {/* Mobile Number (Optional) */}
          <div className="space-y-2">
            <label htmlFor="mobileNumber" className="text-xs font-medium text-foreground/70">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                id="mobileNumber"
                type="tel"
                placeholder="+880 1XXXX XXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(formatPhoneNumber(e.target.value))}
                disabled={loading}
                className="
                  w-full
                  pl-10 pr-4 py-2.5 sm:py-3
                  rounded-lg
                  bg-white/80 border border-border/60
                  text-foreground
                  text-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                  transition-all duration-200
                  disabled:opacity-70
                "
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-medium text-foreground/70">
              Password (min. 8 characters) *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="
                  w-full
                  pl-10 pr-10 py-2.5 sm:py-3
                  rounded-lg
                  bg-white/80 border border-border/60
                  text-foreground
                  text-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                  transition-all duration-200
                  disabled:opacity-70
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-muted-foreground hover:text-foreground
                  transition-colors
                  disabled:opacity-70
                "
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Password Strength Meter */}
            {password && <PasswordStrengthMeter password={password} showRequirements={true} />}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground/70">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="
                  w-full
                  pl-10 pr-10 py-2.5 sm:py-3
                  rounded-lg
                  bg-white/80 border border-border/60
                  text-foreground
                  text-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                  transition-all duration-200
                  disabled:opacity-70
                "
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-muted-foreground hover:text-foreground
                  transition-colors
                  disabled:opacity-70
                "
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div
              className={`
                text-xs font-medium px-3 py-2 rounded-lg
                ${
                  password === confirmPassword
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }
              `}
            >
              {password === confirmPassword
                ? "✓ Passwords match"
                : "✗ Passwords do not match"}
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={loading}
              className="
                w-4 h-4 mt-1
                rounded
                accent-primary
                cursor-pointer
              "
            />
            <label
              htmlFor="terms"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              I agree to the Terms of Service and Privacy Policy *
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full mt-4"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </AuthCard>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-medium text-muted-foreground">Or</span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Social Registration */}
      <Button
        onClick={handleGoogleSignUp}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        <svg
          className="w-4 h-4 mr-2"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </Button>

      {/* Footer Links */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="h-px bg-border/30 w-12" />
        <SocialLinks size="sm" />
      </div>

      {/* Sign In Link */}
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={() => router.push("/auth/login")}
          className="font-semibold text-primary hover:text-primary/80 transition"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
