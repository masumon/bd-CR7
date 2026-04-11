"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureBiometricCredential, verifyBiometricAssertion } from "@/lib/webauthn";
import { useAuthStore } from "@/store/authStore";
import type { BiometricState, View } from "../types";

type RouterLike = {
  replace: (href: string) => void;
};

export function useAuthFlow(router: RouterLike) {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const persistedToken = useAuthStore((s) => s.token);
  const persistedUserId = useAuthStore((s) => s.userId);

  const [view, setView] = useState<View>("splash");
  const [showOverlay, setShowOverlay] = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const persistedTokenRef = useRef(persistedToken);
  useEffect(() => {
    let splashTimer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/dashboard");
          return;
        }
      }

      const splashAlreadyShown =
        typeof window !== "undefined" && window.sessionStorage.getItem("bdcr7-login-splash-shown") === "1";
      if (splashAlreadyShown) {
        setView("landing");
        return;
      }

      splashTimer = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("bdcr7-login-splash-shown", "1");
        }
        setView("landing");
      }, 800);
    };
    void run();
    return () => clearTimeout(splashTimer);
  }, [router]);

  // Trusted device: if "Remember Me" was set AND a valid Supabase session exists,
  // attempt silent session restore so the user never has to re-type credentials.
  useEffect(() => {
    const remembered = localStorage.getItem("bdcr7-remember-me") === "1";
    const rememberedEmail = localStorage.getItem("bdcr7-remember-email") || "";
    setSiRemember(remembered);
    if (rememberedEmail) setSiEmail(rememberedEmail);

    if (!remembered || !supabase) return;

    // Capture in a non-null local so TypeScript keeps the narrowing inside callbacks.
    const client = supabase;

    // Try refreshing the Supabase session silently. If it succeeds the auth
    // guard in MobileAppShell will redirect to /dashboard automatically.
    void client.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Session still valid — redirect handled by the splash effect above.
        return;
      }
      // Session expired but remember-me set → try refresh token silently
      void client.auth.refreshSession().catch(() => {
        // If refresh fails, fall through to normal login
      });
    });
  }, []);

  const autoTriggeredRef = useRef(false);
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPass, setSiShowPass] = useState(false);
  const [siRemember, setSiRemember] = useState(false);
  const [siCapsLock, setSiCapsLock] = useState(false);
  const [siLoading, setSiLoading] = useState(false);
  const [siError, setSiError] = useState("");
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSiError("");
    setSiLoading(true);
    setShowOverlay(true);
    try {
      await login(siEmail, siPassword);
      if (siRemember) {
        localStorage.setItem("bdcr7-remember-me", "1");
        localStorage.setItem("bdcr7-remember-email", siEmail.trim());
      } else {
        localStorage.removeItem("bdcr7-remember-me");
        localStorage.removeItem("bdcr7-remember-email");
      }
      setAuthDone(true);
    } catch (err) {
      setSiError((err as Error).message);
      setShowOverlay(false);
      setAuthDone(false);
    } finally {
      setSiLoading(false);
    }
  };

  const [suFullName, setSuFullName] = useState("");
  const [suUserId, setSuUserId] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirmPass, setSuConfirmPass] = useState("");
  const [suShowPass, setSuShowPass] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);
  const [suLoading, setSuLoading] = useState(false);
  const [suError, setSuError] = useState("");
  const [suSuccess, setSuSuccess] = useState(false);
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSuError("");
    setSuLoading(true);
    setShowOverlay(true);
    try {
      await register(suEmail, suPassword, suFullName, "viewer");
      setSuSuccess(true);
      setAuthDone(true);
    } catch (err) {
      setSuError((err as Error).message);
      setShowOverlay(false);
      setAuthDone(false);
    } finally {
      setSuLoading(false);
    }
  };

  const [otpContact, setOtpContact] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (otpResendTimer <= 0) return;
    const t = setTimeout(() => setOtpResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendTimer]);

  const handleSendOtp = async () => {
    const contact = otpContact.trim();
    if (!contact) {
      setOtpError("ফোন নম্বর বা ইমেইল লিখুন");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const isEmail = contact.includes("@");

    if (isEmail) {
      // ── Email OTP via Supabase built-in ──────────────────────────────────
      if (!supabase) {
        setOtpLoading(false);
        setOtpError("সার্ভিস পাওয়া যাচ্ছে না।");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: contact,
        options: { shouldCreateUser: false },
      });
      setOtpLoading(false);
      if (error) {
        const msg = error.message || "";
        if (msg.toLowerCase().includes("user not found") || msg.toLowerCase().includes("no user")) {
          setOtpError("এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট নেই। আগে রেজিস্ট্রেশন করুন।");
        } else {
          setOtpError(msg);
        }
      } else {
        setOtpStep(2);
        setOtpResendTimer(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } else {
      // ── Phone OTP via custom Python API + Twilio SMS ──────────────────────
      // Normalize BD numbers: 01XXXXXXXXX → +8801XXXXXXXXX
      let phone = contact;
      if (phone.startsWith("01") && phone.length === 11) phone = "+880" + phone.slice(1);
      else if (phone.startsWith("880") && !phone.startsWith("+")) phone = "+" + phone;

      try {
        const res = await fetch("/api/auth/otp/phone/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const json = await res.json() as { detail?: string; phone?: string; expires_in?: number };
        if (!res.ok) {
          setOtpError(json.detail || "OTP পাঠানো ব্যর্থ হয়েছে।");
        } else {
          setOtpStep(2);
          setOtpResendTimer(60);
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
      } catch {
        setOtpError("নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otpDigits.join("");
    if (otpCode.length < 6) {
      setOtpError("৬টি সংখ্যা পূরণ করুন");
      return;
    }
    if (!supabase) {
      setOtpError("সার্ভিস পাওয়া যাচ্ছে না।");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const contact = otpContact.trim();
    const isEmail = contact.includes("@");

    if (isEmail) {
      // ── Email OTP verify via Supabase ─────────────────────────────────────
      const { data, error } = await supabase.auth.verifyOtp({
        email: contact,
        token: otpCode,
        type: "email",
      });
      if (error || !data.session || !data.user) {
        setOtpLoading(false);
        setOtpError(error?.message || "OTP যাচাই ব্যর্থ। আবার চেষ্টা করুন।");
        return;
      }
      const { role: currentRole } = useAuthStore.getState();
      useAuthStore.setState({ token: data.session.access_token, userId: data.user.id, role: currentRole || null });
      await useAuthStore.getState().fetchUser().catch(() => {});
      setOtpSuccess(true);
      setShowOverlay(true);
      setAuthDone(true);
      setOtpLoading(false);
    } else {
      // ── Phone OTP verify via custom Python API ────────────────────────────
      let phone = contact;
      if (phone.startsWith("01") && phone.length === 11) phone = "+880" + phone.slice(1);
      else if (phone.startsWith("880") && !phone.startsWith("+")) phone = "+" + phone;

      try {
        const res = await fetch("/api/auth/otp/phone/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: otpCode }),
        });
        const json = await res.json() as {
          detail?: string;
          token_hash?: string;
          email?: string;
          type?: string;
          role?: string;
          user_id?: string;
        };

        if (!res.ok) {
          setOtpError(json.detail || "OTP যাচাই ব্যর্থ।");
          setOtpLoading(false);
          return;
        }

        // Exchange magic-link token for a real Supabase session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: json.token_hash!,
          type: "magiclink",
        });

        if (error || !data.session || !data.user) {
          setOtpError(error?.message || "সেশন তৈরি ব্যর্থ। আবার চেষ্টা করুন।");
          setOtpLoading(false);
          return;
        }

        useAuthStore.setState({
          token: data.session.access_token,
          userId: data.user.id,
          role: json.role || null,
        });
        await useAuthStore.getState().fetchUser().catch(() => {});
        setOtpSuccess(true);
        setShowOverlay(true);
        setAuthDone(true);
      } catch {
        setOtpError("নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otpDigits];
      digits.split("").forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtpDigits(newOtp);
      otpRefs.current[Math.min(index + digits.length - 1, 5)]?.focus();
      return;
    }
    const newOtp = [...otpDigits];
    newOtp[index] = value.replace(/\D/g, "").slice(-1);
    setOtpDigits(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setOtpStep(1);
    setOtpDigits(Array(6).fill(""));
    setOtpError("");
    await handleSendOtp();
  };

  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [bioState, setBioState] = useState<BiometricState>("idle");
  const handleBiometric = useCallback(async () => {
    setBioLoading(true);
    setBioError("");
    setBioState("scanning");
    try {
      const existingSession = await supabase?.auth.getSession();
      const session = existingSession?.data.session;
      const hasSession = Boolean(persistedToken || session);
      if (!hasSession) {
        setBioError("Sign in with email once first to enable biometric.");
        setBioState("failed");
        setBioLoading(false);
        return;
      }
      const token = persistedToken || session?.access_token;
      const userId = persistedUserId || session?.user?.id;
      const userEmail = session?.user?.email || "bdcr7.user@local";
      if (!token || !userId) {
        setBioError("Session expired. Sign in with email/password first.");
        setBioState("failed");
        setBioLoading(false);
        return;
      }
      await ensureBiometricCredential(token, userId, userEmail);
      await verifyBiometricAssertion(token);
      setBioState("success");
      setShowOverlay(true);
      setAuthDone(true);
    } catch (err) {
      setBioError((err as Error).message || "Biometric failed.");
      setBioState("failed");
    } finally {
      setBioLoading(false);
    }
  }, [persistedToken, persistedUserId]);

  // Trusted device: when remember-me is set and landing shows, auto-open biometric
  // so the user taps the fingerprint once instead of typing email + password.
  useEffect(() => {
    if (view !== "landing") return;
    if (autoTriggeredRef.current) return;
    const remembered = localStorage.getItem("bdcr7-remember-me") === "1";
    if (!remembered) return;
    autoTriggeredRef.current = true;
    const t = setTimeout(() => void handleBiometric(), 900);
    return () => clearTimeout(t);
  }, [view, handleBiometric]);

  const handleGoogleOAuth = async () => {
    if (!supabase) return;
    // redirectTo must point to the /auth/callback route which exchanges the
    // OAuth code for a session. Pointing directly to /dashboard causes a
    // "validation_failed" 400 because no code exchange happens.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
  };

  return {
    view,
    setView,
    showOverlay,
    authDone,
    setAuthDone,
    setShowOverlay,
    signin: { email: siEmail, setEmail: setSiEmail, password: siPassword, setPassword: setSiPassword, showPass: siShowPass, setShowPass: setSiShowPass, remember: siRemember, setRemember: setSiRemember, capsLock: siCapsLock, setCapsLock: setSiCapsLock, loading: siLoading, error: siError, submit: handleSignIn },
    signup: { fullName: suFullName, setFullName: setSuFullName, userId: suUserId, setUserId: setSuUserId, email: suEmail, setEmail: setSuEmail, phone: suPhone, setPhone: setSuPhone, password: suPassword, setPassword: setSuPassword, confirmPass: suConfirmPass, setConfirmPass: setSuConfirmPass, showPass: suShowPass, setShowPass: setSuShowPass, showConfirm: suShowConfirm, setShowConfirm: setSuShowConfirm, loading: suLoading, error: suError, success: suSuccess, submit: handleSignUp },
    otp: {
      contact: otpContact,
      setContact: setOtpContact,
      step: otpStep,
      digits: otpDigits,
      loading: otpLoading,
      error: otpError,
      success: otpSuccess,
      resendTimer: otpResendTimer,
      refs: otpRefs,
      send: handleSendOtp,
      verify: handleVerifyOtp,
      resend: handleResendOtp,
      onDigitInput: handleOtpInput,
      onDigitKeyDown: handleOtpKeyDown,
      resetAndBackToLanding: () => {
        setOtpStep(1);
        setOtpDigits(Array(6).fill(""));
        setOtpError("");
        setView("landing");
      },
    },
    biometric: { loading: bioLoading, error: bioError, state: bioState, setState: setBioState, trigger: handleBiometric },
    oauth: { loginWithGoogle: handleGoogleOAuth, signUpWithGoogle: handleGoogleOAuth },
  };
}
