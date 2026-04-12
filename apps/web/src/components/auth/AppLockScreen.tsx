"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, KeyRound, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { ensureBiometricCredential, isWebAuthnSupported, verifyBiometricAssertion } from "@/lib/webauthn";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/errorUtils";

/* ── Constants ──────────────────────────────────────────────────── */
const LOCK_KEY = "bdcr7-app-locked";
const LOCK_GRACE_MS = 10_000; // 10 s grace after hide before locking
const SETTINGS_CATALOG_KEY = "bdcr7-settings-catalog";

function readSecurityToggle(toggleId: string, fallback = true): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_CATALOG_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Array<{ id?: string; enabled?: boolean }>;
    const matched = parsed.find((item) => item.id === toggleId);
    if (!matched) return fallback;
    return matched.enabled !== false;
  } catch {
    return fallback;
  }
}

/* ── Hook: detect app backgrounding and set lock ─────────────────── */
export function useAppLock() {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = useAuthStore((s) => s.userId);

  const lock = useCallback(() => {
    if (!userId) return; // never lock when unauthenticated
    sessionStorage.setItem(LOCK_KEY, "1");
    setLocked(true);
  }, [userId]);

  const unlock = useCallback(() => {
    sessionStorage.removeItem(LOCK_KEY);
    setLocked(false);
  }, []);

  // Restore lock state after page refresh / SSR rehydration
  useEffect(() => {
    if (typeof window === "undefined") return;
    const appLockEnabled = readSecurityToggle("sec-app-lock-overlay", true);
    if (!appLockEnabled) {
      sessionStorage.removeItem(LOCK_KEY);
      setLocked(false);
      return;
    }
    if (sessionStorage.getItem(LOCK_KEY) === "1" && userId) {
      setLocked(true);
    }
  }, [userId]);

  // Listen for visibility changes — lock after LOCK_GRACE_MS in background
  useEffect(() => {
    if (!userId) return;

    const onHide = () => {
      if (!readSecurityToggle("sec-app-lock-overlay", true)) return;
      timerRef.current = setTimeout(lock, LOCK_GRACE_MS);
    };

    const onShow = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!readSecurityToggle("sec-app-lock-overlay", true)) {
        sessionStorage.removeItem(LOCK_KEY);
        setLocked(false);
        return;
      }
      // If the session store says locked, enforce it
      if (sessionStorage.getItem(LOCK_KEY) === "1") {
        setLocked(true);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        onHide();
      } else {
        onShow();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, lock]);

  return { locked, lock, unlock };
}

/* ── Component ────────────────────────────────────────────────────── */
type Props = {
  onUnlock: () => void;
};

type LockStep = "idle" | "scanning" | "password" | "success" | "failed";

export function AppLockScreen({ onUnlock }: Props) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState<LockStep>("idle");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [email, setEmail] = useState("");

  // Pre-fill email from remember-me storage
  useEffect(() => {
    const stored = localStorage.getItem("bdcr7-remember-email") || "";
    setEmail(stored);
  }, []);

  const canBiometric = isWebAuthnSupported() && readSecurityToggle("sec-biometric-unlock", true);

  const handleBiometric = useCallback(async () => {
    setError("");
    setStep("scanning");
    try {
      const sessionData = await supabase?.auth.getSession();
      const accessToken = token || sessionData?.data.session?.access_token;
      const uid = userId || sessionData?.data.session?.user?.id;
      const userEmail = sessionData?.data.session?.user?.email || "bdcr7.user@local";

      if (!accessToken || !uid) {
        setError("সেশন মেয়াদ শেষ। পাসওয়ার্ড দিয়ে লগইন করুন।");
        setStep("password");
        return;
      }

      await ensureBiometricCredential(accessToken, uid, userEmail);
      await verifyBiometricAssertion(accessToken);
      setStep("success");
      setTimeout(onUnlock, 600);
    } catch (err) {
      setError(getErrorMessage(err) || "বায়োমেট্রিক যাচাই ব্যর্থ হয়েছে।");
      setStep("failed");
    }
  }, [token, userId, onUnlock]);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("ইমেইল ও পাসওয়ার্ড দিন।");
      return;
    }
    setPwLoading(true);
    setError("");
    try {
      await login(email, password);
      setStep("success");
      setTimeout(onUnlock, 600);
    } catch (err) {
      setError(getErrorMessage(err) || "পাসওয়ার্ড ভুল হয়েছে।");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f1a16]/95 font-[var(--font-display)] backdrop-blur-lg"
      role="dialog"
      aria-label="অ্যাপ লক স্ক্রিন"
    >
      {/* Logo / brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/40 bg-amber-500/10">
          {step === "success" ? (
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          ) : step === "failed" ? (
            <ShieldX className="h-8 w-8 text-rose-400" />
          ) : (
            <Fingerprint className="h-8 w-8 text-amber-400" />
          )}
        </div>
        <p className="text-base font-semibold tracking-wide text-white">BD CR7 ERP</p>
        <p className="text-xs text-white/50">অ্যাপটি লক আছে। পরিচয় যাচাই করুন।</p>
      </div>

      {/* Biometric section */}
      {step !== "password" && canBiometric && (
        <div className="mb-6 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleBiometric}
            disabled={step === "scanning" || step === "success"}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400/50 bg-amber-500/10 transition active:scale-95 disabled:opacity-60"
            aria-label="ফিঙ্গারপ্রিন্ট / ফেস স্ক্যান"
          >
            {step === "scanning" ? (
              <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
            ) : (
              <Fingerprint className="h-9 w-9 text-amber-400" />
            )}
            {step === "scanning" && (
              <span className="absolute -bottom-6 whitespace-nowrap text-[11px] text-amber-300/80">
                স্ক্যান করা হচ্ছে...
              </span>
            )}
          </button>

          <p className="mt-8 text-xs text-white/40">বা</p>
        </div>
      )}

      {/* Password fallback */}
      {step === "password" || !canBiometric ? (
        <form onSubmit={handlePassword} className="w-full max-w-xs space-y-3 px-6">
          {!email && (
            <input
              type="email"
              placeholder="ইমেইল"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/50"
            />
          )}
          <input
            type="password"
            placeholder="পাসওয়ার্ড"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/50"
          />
          <button
            type="submit"
            disabled={pwLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-semibold text-sm text-white transition hover:bg-amber-400 disabled:opacity-60"
          >
            {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {pwLoading ? "যাচাই হচ্ছে..." : "পাসওয়ার্ড দিয়ে আনলক"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setStep("password"); setError(""); }}
          className="text-xs text-white/40 underline underline-offset-2 hover:text-white/60"
        >
          পাসওয়ার্ড দিয়ে আনলক করুন
        </button>
      )}

      {error && (
        <p className="mt-4 max-w-xs rounded-xl border border-rose-400/30 bg-rose-900/20 px-3 py-2 text-center text-xs text-rose-300">
          {error}
        </p>
      )}

      {step === "success" && (
        <p className="mt-4 text-xs text-emerald-400">আনলক সফল! ড্যাশবোর্ড খুলছে...</p>
      )}
    </div>
  );
}
