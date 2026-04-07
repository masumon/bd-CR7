"use client";

import { Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { isWebAuthnSupported, verifyBiometricAssertion } from "@/lib/webauthn";

interface BiometricButtonProps {
  token?: string;
  onBiometricAttempt?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BiometricButton({ 
  token,
  onBiometricAttempt, 
  onSuccess,
  onError,
  disabled = false,
  size = "md" 
}: BiometricButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isWebAuthnSupported());
  }, []);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  const iconSizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const handleBiometric = async () => {
    if (disabled || isScanning || !supported) return;

    setIsScanning(true);
    setScanState("scanning");
    onBiometricAttempt?.();

    try {
      if (token) {
        await verifyBiometricAssertion(token);
      }
      setScanState("success");
      onSuccess?.();
      setTimeout(() => {
        setIsScanning(false);
        setScanState("idle");
      }, 1500);
    } catch (err) {
      setScanState("error");
      onError?.(err instanceof Error ? err : new Error("Biometric verification failed"));
      setTimeout(() => {
        setIsScanning(false);
        setScanState("idle");
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleBiometric}
        disabled={disabled || isScanning || !supported}
        className={`
          ${sizeClasses[size]}
          relative rounded-full
          flex items-center justify-center
          transition-all duration-300
          cursor-pointer
          group
          disabled:opacity-60 disabled:cursor-not-allowed
          border border-white/30
          backdrop-blur-lg
          bg-white/[0.08]
          shadow-lg
          hover:bg-white/[0.12]
          hover:border-white/40
          hover:shadow-xl
          active:scale-95
        `}
        title={supported ? "Biometric Login (Face ID / Fingerprint)" : "Biometric not supported on this device"}
      >
        {scanState === "idle" && (
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        )}

        {scanState === "scanning" && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border border-primary/50" />
          </>
        )}

        {scanState === "success" && (
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse border border-green-500/50" />
        )}

        <Fingerprint 
          className={`
            ${iconSizeClasses[size]}
            text-primary
            relative z-10
            transition-all duration-300
            ${scanState === "scanning" ? "animate-pulse" : ""}
          `}
        />
      </button>

      <span
        className={`
          text-xs font-medium
          transition-all duration-200
          ${
            !supported
              ? "text-muted-foreground"
              : scanState === "scanning"
              ? "text-primary animate-pulse"
              : scanState === "success"
              ? "text-green-600"
              : scanState === "error"
              ? "text-red-500"
              : "text-muted-foreground"
          }
        `}
      >
        {!supported && "Not available"}
        {supported && scanState === "idle" && "Face ID / Fingerprint"}
        {supported && scanState === "scanning" && "Scanning..."}
        {supported && scanState === "success" && "Success ✓"}
        {supported && scanState === "error" && "Try again"}
      </span>
    </div>
  );
}
