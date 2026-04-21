"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { fetchSecuritySettings, verifyPinLogin, type SecuritySettings } from "@/lib/securityAuth";
import { supabase } from "@/lib/supabase";
import { ensureBiometricCredential, signInWithPasskey, verifyBiometricAssertion } from "@/lib/webauthn";
import { useAuthStore } from "@/store/authStore";
import type { BiometricState, View } from "../types";

type RouterLike = {
  replace: (href: string) => void;
};

/** Converts raw WebAuthn/passkey error messages to user-friendly Bangla strings. */
function resolveWebAuthnErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (!raw || lower.includes("passkey sign in failed") || lower.includes("biometric failed")) {
    return "যাচাই ব্যর্থ হয়েছে। পাসওয়ার্ড বা Email OTP ব্যবহার করুন।";
  }
  if (lower.includes("disabled")) {
    return "এই অ্যাকাউন্টে Passkey/বায়োমেট্রিক নিষ্ক্রিয়। পাসওয়ার্ড বা Email OTP ব্যবহার করুন।";
  }
  if (lower.includes("not enrolled") || lower.includes("no passkey") || lower.includes("no cryptographic")) {
    return "এই অ্যাকাউন্টে কোনো Passkey নেই। পাসওয়ার্ড দিয়ে প্রথমে লগইন করুন।";
  }
  if (lower.includes("not trusted") || lower.includes("untrusted device") || lower.includes("device is not trusted")) {
    return "এই ডিভাইসটি বিশ্বস্ত নয়। পাসওয়ার্ড বা Email OTP দিয়ে লগইন করুন।";
  }
  if (lower.includes("cancelled") || lower.includes("verification failed")) {
    return "যাচাই বাতিল বা ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
  }
  if (lower.includes("not supported") || lower.includes("webauthn is not supported")) {
    return "এই ডিভাইস বা ব্রাউজার WebAuthn সাপোর্ট করে না।";
  }
  if (lower.includes("backend") || lower.includes("not configured") || lower.includes("backend unreachable")) {
    return "সার্ভিস পাওয়া যাচ্ছে না। পাসওয়ার্ড বা Email OTP ব্যবহার করুন।";
  }
  return `${raw} পাসওয়ার্ড বা Email OTP ব্যবহার করুন।`;
}

export function useAuthFlow(router: RouterLike, returnTo: string = "/dashboard") {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const persistedToken = useAuthStore((s) => s.token);
  const persistedUserId = useAuthStore((s) => s.userId);
  const fetchUser = useAuthStore((s) => s.fetchUser);

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
          router.replace(returnTo);
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
  }, [router, returnTo]);

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
  const [securityMethods, setSecurityMethods] = useState<SecuritySettings | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPass, setSiShowPass] = useState(false);
  const [siRemember, setSiRemember] = useState(false);
  const [siCapsLock, setSiCapsLock] = useState(false);
  const [siLoading, setSiLoading] = useState(false);
  const [siError, setSiError] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
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

  const completeMagicLinkLogin = useCallback(async (tokenHash: string, email: string, role: string | null | undefined, userId: string | null | undefined) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
      email,
    });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || "Passkey sign-in session creation failed.");
    }

    useAuthStore.setState({
      token: data.session.access_token,
      userId: userId || data.user.id,
      role: role || null,
    });
    if (typeof window !== "undefined") {
      const normalizedEmail = email.trim().toLowerCase();
      if (localStorage.getItem("bdcr7-remember-me") === "1" || !localStorage.getItem("bdcr7-remember-email")) {
        localStorage.setItem("bdcr7-remember-email", normalizedEmail);
      }
    }
    await fetchUser().catch(() => {});
    setShowOverlay(true);
    setAuthDone(true);
  }, [fetchUser]);

  const refreshSecurityMethods = useCallback(async (emailHint?: string) => {
    const candidateEmail = (emailHint || siEmail || localStorage.getItem("bdcr7-remember-email") || "").trim().toLowerCase();
    if (!candidateEmail || !candidateEmail.includes("@")) {
      setSecurityMethods(null);
      return;
    }

    setSecurityLoading(true);
    try {
      const next = await fetchSecuritySettings({ email: candidateEmail });
      setSecurityMethods(next);
    } catch {
      setSecurityMethods(null);
    } finally {
      setSecurityLoading(false);
    }
  }, [siEmail]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("bdcr7-remember-email") || "";
    const candidateEmail = (siEmail || rememberedEmail).trim().toLowerCase();
    if (!candidateEmail) {
      setSecurityMethods(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      void refreshSecurityMethods(candidateEmail);
    }, 320);
    return () => window.clearTimeout(timeout);
  }, [refreshSecurityMethods, siEmail]);

  const handlePasskey = useCallback(async (emailHint?: string) => {
    const candidateEmail = (emailHint || siEmail || localStorage.getItem("bdcr7-remember-email") || "").trim().toLowerCase();
    if (!candidateEmail) {
      setPasskeyError("Passkey ব্যবহার করতে আগে আপনার ইমেইল দিন।");
      setView("signin");
      return;
    }

    setPasskeyLoading(true);
    setPasskeyError("");
    setPinError("");
    try {
      const result = await signInWithPasskey(candidateEmail);
      await completeMagicLinkLogin(result.token_hash, result.email, result.role || null, result.user_id || null);
    } catch (err) {
      setPasskeyError(resolveWebAuthnErrorMessage(getErrorMessage(err)));
      setAuthDone(false);
      setShowOverlay(false);
    } finally {
      setPasskeyLoading(false);
    }
  }, [completeMagicLinkLogin, siEmail]);

  const handlePinSignIn = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const candidateEmail = (siEmail || localStorage.getItem("bdcr7-remember-email") || "").trim().toLowerCase();
    if (!candidateEmail) {
      setPinError("PIN ব্যবহার করতে আগে আপনার ইমেইল দিন।");
      return;
    }

    setPinLoading(true);
    setPinError("");
    setPasskeyError("");
    try {
      const result = await verifyPinLogin(candidateEmail, pinCode);
      await completeMagicLinkLogin(result.token_hash, result.email, result.role || null, result.user_id || null);
    } catch (err) {
      setPinError(getErrorMessage(err) || "PIN sign in failed.");
      setAuthDone(false);
      setShowOverlay(false);
    } finally {
      setPinLoading(false);
    }
  }, [completeMagicLinkLogin, pinCode, siEmail]);

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
    try {
      await register(suEmail, suPassword, suFullName, "viewer");
      setSuSuccess(true);

      // Only redirect immediately when Supabase auto-confirms the session
      // (e.g. email confirmation disabled in settings).
      // When email confirmation IS required, data.session is null and we must
      // NOT push to /dashboard — the user must click the confirmation link first.
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setShowOverlay(true);
          setAuthDone(true);
        }
        // else: stay on signup view showing the success message ("Check your inbox")
      }
    } catch (err) {
      setSuError((err as Error).message);
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
      setOtpError("ইমেইল লিখুন");
      return;
    }
    if (!contact.includes("@")) {
      setOtpError("শুধু Email OTP fallback সক্রিয় আছে। বৈধ ইমেইল লিখুন।");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const response = await fetch("/api/auth/otp/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contact }),
      });
      const json = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null;
      if (!response.ok) {
        const detail = json?.detail || json?.error || "OTP send failed.";
        throw new Error(detail);
      }
      setOtpStep(2);
      setOtpResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      const msg = getErrorMessage(error);
      if (msg.toLowerCase().includes("no active account") || msg.toLowerCase().includes("not found")) {
        setOtpError("এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট নেই। আগে রেজিস্ট্রেশন করুন।");
      } else {
        setOtpError(msg || "OTP পাঠানো যায়নি।");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otpDigits.join("");
    if (otpCode.length < 6) {
      setOtpError("৬টি সংখ্যা পূরণ করুন");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const contact = otpContact.trim();
    try {
      const response = await fetch("/api/auth/otp/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contact, otp: otpCode }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            error?: string;
            data?: { token_hash?: string; email?: string; role?: string; user_id?: string };
            token_hash?: string;
            email?: string;
            role?: string;
            user_id?: string;
          }
        | null;
      const result = payload?.data ?? payload;
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || "OTP verification failed.");
      }
      const tokenHash = result?.token_hash;
      const verifiedEmail = result?.email;
      if (!tokenHash || !verifiedEmail) {
        throw new Error("OTP verification failed. Session data missing.");
      }

      await completeMagicLinkLogin(tokenHash, verifiedEmail, result?.role || null, result?.user_id || null);
      setOtpSuccess(true);
    } catch (error) {
      setOtpError(getErrorMessage(error) || "OTP যাচাই ব্যর্থ। আবার চেষ্টা করুন।");
      setAuthDone(false);
      setShowOverlay(false);
    } finally {
      setOtpLoading(false);
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
        const candidateEmail = (siEmail || localStorage.getItem("bdcr7-remember-email") || "").trim().toLowerCase();
        if (!candidateEmail) {
          setBioError("বায়োমেট্রিক চালু করতে আগে একবার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।");
          setBioState("failed");
          setView("signin");
          setBioLoading(false);
          return;
        }
        const result = await signInWithPasskey(candidateEmail);
        await completeMagicLinkLogin(result.token_hash, result.email, result.role || null, result.user_id || null);
        setBioState("success");
        setBioLoading(false);
        return;
      }
      const token = persistedToken || session?.access_token;
      const userId = persistedUserId || session?.user?.id;
      const userEmail = session?.user?.email || "bdcr7.user@local";
      if (!token || !userId) {
        setBioError("সেশন শেষ হয়েছে। ইমেইল ও পাসওয়ার্ড দিয়ে আবার লগইন করুন।");
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
      setBioError(resolveWebAuthnErrorMessage(getErrorMessage(err)));
      setBioState("failed");
    } finally {
      setBioLoading(false);
    }
  }, [completeMagicLinkLogin, persistedToken, persistedUserId, siEmail]);

  // Trusted device: when remember-me is set and landing shows, auto-open biometric
  // so the user taps the fingerprint once instead of typing email + password.
  useEffect(() => {
    if (view !== "landing") return;
    if (autoTriggeredRef.current) return;
    const remembered = localStorage.getItem("bdcr7-remember-me") === "1";
    if (!remembered || !securityMethods?.biometric_enabled || !securityMethods.current_device_trusted || !securityMethods.has_biometric_credentials) return;
    autoTriggeredRef.current = true;
    const t = setTimeout(() => void handleBiometric(), 900);
    return () => clearTimeout(t);
  }, [handleBiometric, securityMethods?.biometric_enabled, securityMethods?.current_device_trusted, view]);

  const rememberedEmail = typeof window !== "undefined" ? (localStorage.getItem("bdcr7-remember-email") || "") : "";
  const activeEmailHint = (siEmail || rememberedEmail || securityMethods?.email_hint || "").trim().toLowerCase();
  const showBiometric = Boolean(securityMethods?.biometric_enabled && securityMethods.current_device_trusted && securityMethods.has_biometric_credentials);
  const showPin = Boolean(securityMethods?.pin_enabled && securityMethods.current_device_trusted);
  const securityHint = securityLoading
    ? "বিশ্বস্ত ডিভাইস লগইন পদ্ধতি যাচাই হচ্ছে..."
    : activeEmailHint
      ? showBiometric || showPin
        ? "এই অ্যাকাউন্টের জন্য বিশ্বস্ত ডিভাইস লগইন পদ্ধতি পাওয়া গেছে।"
        : "পাসওয়ার্ড লগইন সক্রিয় আছে। Security Settings থেকে বায়োমেট্রিক বা PIN চালু করুন।"
      : "বায়োমেট্রিক বা PIN লগইন খুঁজতে আপনার ইমেইল একবার দিন।";

  const handleGoogleOAuth = async () => {
    if (!supabase) return;
    // redirectTo must point to the /auth/callback route which exchanges the
    // OAuth code for a session. Pointing directly to /dashboard causes a
    // "validation_failed" 400 because no code exchange happens.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}` },
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
    passkey: { loading: passkeyLoading, error: passkeyError, trigger: handlePasskey },
    pin: {
      code: pinCode,
      setCode: setPinCode,
      loading: pinLoading,
      error: pinError,
      submit: handlePinSignIn,
    },
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
    security: {
      loading: securityLoading,
      emailHint: activeEmailHint,
      showBiometric,
      showPin,
      hint: securityHint,
      refresh: refreshSecurityMethods,
    },
    oauth: { loginWithGoogle: handleGoogleOAuth, signUpWithGoogle: handleGoogleOAuth },
  };
}
