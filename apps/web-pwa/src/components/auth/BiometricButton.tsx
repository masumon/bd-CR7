"use client";

import { Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";

interface BiometricButtonProps {
  onBiometricAttempt?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BiometricButton({ 
  onBiometricAttempt, 
  disabled = false,
  size = "md" 
}: BiometricButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "success" | "error">("idle");

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
    if (disabled || isScanning) return;

    setIsScanning(true);
    setScanState("scanning");

    try {
      // Simulate biometric scanning (real implementation would use WebAuthn)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setScanState("success");
      onBiometricAttempt?.();

      // Reset after success
      setTimeout(() => {
        setIsScanning(false);
        setScanState("idle");
      }, 1500);
    } catch (error) {
      setScanState("error");
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
        disabled={disabled || isScanning}
        className={`
          ${sizeClasses[size]}
          relative rounded-full
          flex items-center justify-center
          transition-all duration-300
          cursor-pointer
          group
          disabled:opacity-60 disabled:cursor-not-allowed
          
          /* Glass effect */
          border border-white/30
          backdrop-blur-lg
          -webkit-backdrop-filter: blur(18px)
          bg-white/[0.08]
          
          /* Shadow */
          shadow-lg
          
          /* Hover state */
          hover:bg-white/[0.12]
          hover:border-white/40
          hover:shadow-xl
          
          /* Active state */
          active:scale-95
          
          /* Responsive sizing */
          md:${sizeClasses["lg"]}
        `}
        title="Biometric Login (Face ID / Fingerprint)"
      >
        {/* Pulse animation when idle */}
        {scanState === "idle" && (
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        )}

        {/* Scanning animation */}
        {scanState === "scanning" && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border border-primary/50" />
          </>
        )}

        {/* Success animation */}
        {scanState === "success" && (
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse border border-green-500/50" />
        )}

        {/* Icon */}
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

      {/* Status text - responsive */}
      <span
        className={`
          text-xs font-medium
          transition-all duration-200
          ${
            scanState === "scanning"
              ? "text-primary animate-pulse"
              : scanState === "success"
              ? "text-green-600"
              : scanState === "error"
              ? "text-red-500"
              : "text-muted-foreground"
          }
        `}
      >
        {scanState === "idle" && "Face ID / Fingerprint"}
        {scanState === "scanning" && "Scanning..."}
        {scanState === "success" && "Success ✓"}
        {scanState === "error" && "Try again"}
      </span>
    </div>
  );
}
