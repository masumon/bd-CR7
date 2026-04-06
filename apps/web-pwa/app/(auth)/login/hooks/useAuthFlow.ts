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
      if (persistedTokenRef.current && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/dashboard");
          return;
        }
      }
      splashTimer = setTimeout(() => setView("landing"), 800);
    };
    void run();
    return () => clearTimeout(splashTimer);
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("bdcr7-theme");
    document.documentElement.classList.toggle("dark", stored !== "light");
  }, []);

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
    if (!otpContact.trim()) {
      setOtpError("Enter your phone number");
      return;
    }
    if (!supabase) {
      setOtpError("Service unavailable");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const { error } = await supabase.auth.signInWithOtp({ phone: otpContact.trim() });
    setOtpLoading(false);
    if (error) {
      setOtpError(error.message);
    } else {
      setOtpStep(2);
      setOtpResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleVerifyOtp = async () => {
    const token = otpDigits.join("");
    if (token.length < 6) {
      setOtpError("Enter all 6 digits");
      return;
    }
    if (!supabase) {
      setOtpError("Service unavailable");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: otpContact.trim(),
      token,
      type: "sms",
    });
    if (error || !data.session || !data.user) {
      setOtpLoading(false);
      setOtpError(error?.message || "OTP verification failed. Please try again.");
      return;
    }
    const { role: currentRole } = useAuthStore.getState();
    useAuthStore.setState({ token: data.session.access_token, userId: data.user.id, role: currentRole || null });
    await useAuthStore.getState().fetchUser().catch(() => {});
    setOtpSuccess(true);
    setShowOverlay(true);
    setAuthDone(true);
    setOtpLoading(false);
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

  const handleGoogleOAuth = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
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
