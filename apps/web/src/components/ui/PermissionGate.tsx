"use client";

/**
 * PermissionGate — renders children when a hardware permission is granted,
 * otherwise shows a request/denied/fallback UI.
 *
 * Usage:
 *   <PermissionGate type="camera" fallback={<FileUpload />}>
 *     <CameraCapture />
 *   </PermissionGate>
 */

import { useCallback, useEffect, useState } from "react";
import { Camera, MapPin, ShieldAlert, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  checkCameraPermission,
  checkLocationPermission,
  requestCameraPermission,
  requestLocationPermission,
  type PermissionStatus,
} from "@/lib/permissionHelpers";

type PermissionGateProps = {
  type: "camera" | "location";
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

const COPY = {
  camera: {
    icon: Camera,
    title: "Camera Access Required",
    titleBn: "ক্যামেরা অ্যাক্সেস প্রয়োজন",
    description: "Allow camera to capture photos and videos directly.",
    descriptionBn: "সরাসরি ছবি ও ভিডিও ক্যাপচার করতে ক্যামেরা অনুমতি দিন।",
    requestBtn: "Allow Camera",
    requestBtnBn: "ক্যামেরা অনুমতি দিন",
    deniedTitle: "Camera Access Denied",
    deniedTitleBn: "ক্যামেরা অ্যাক্সেস অস্বীকৃত",
    deniedHint: "Please enable camera access in your browser/device settings.",
    deniedHintBn: "ব্রাউজার বা ডিভাইস সেটিংস থেকে ক্যামেরা অ্যাক্সেস চালু করুন।",
    fallbackLabel: "Upload File Instead",
    fallbackLabelBn: "ফাইল আপলোড করুন",
  },
  location: {
    icon: MapPin,
    title: "Location Access Required",
    titleBn: "লোকেশন অ্যাক্সেস প্রয়োজন",
    description: "Allow location to auto-tag GPS coordinates.",
    descriptionBn: "GPS স্থানাঙ্ক স্বয়ংক্রিয়ভাবে যোগ করতে লোকেশন অনুমতি দিন।",
    requestBtn: "Allow Location",
    requestBtnBn: "লোকেশন অনুমতি দিন",
    deniedTitle: "Location Access Denied",
    deniedTitleBn: "লোকেশন অ্যাক্সেস অস্বীকৃত",
    deniedHint: "Please enable location access in your browser/device settings.",
    deniedHintBn: "ব্রাউজার বা ডিভাইস সেটিংস থেকে লোকেশন চালু করুন।",
    fallbackLabel: "Enter Location Manually",
    fallbackLabelBn: "লোকেশন নিজে লিখুন",
  },
} as const;

export function PermissionGate({ type, fallback, children }: PermissionGateProps) {
  const [status, setStatus] = useState<PermissionStatus>("prompt");
  const [requesting, setRequesting] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const check = useCallback(async () => {
    const s = type === "camera"
      ? await checkCameraPermission()
      : await checkLocationPermission();
    setStatus(s);
    if (s === "denied") setShowFallback(true);
  }, [type]);

  useEffect(() => {
    void check();
  }, [check]);

  const handleRequest = async () => {
    setRequesting(true);
    const s = type === "camera"
      ? await requestCameraPermission()
      : await requestLocationPermission();
    setStatus(s);
    if (s === "denied") setShowFallback(true);
    setRequesting(false);
  };

  if (status === "granted") return <>{children}</>;

  const c = COPY[type];
  const Icon = c.icon;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${status === "denied" ? "bg-rose-500/15 text-rose-400" : "bg-primary/12 text-primary"}`}>
        {status === "denied" ? <ShieldAlert className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          {status === "denied" ? c.deniedTitle : c.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {status === "denied" ? c.deniedHint : c.description}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          {status === "denied" ? c.deniedHintBn : c.descriptionBn}
        </p>
      </div>

      {status !== "denied" && (
        <Button
          onClick={() => void handleRequest()}
          disabled={requesting}
          className="h-9 px-4 text-xs"
        >
          {requesting ? "Requesting..." : c.requestBtn}
        </Button>
      )}

      {fallback && (
        <div className="w-full">
          <button
            onClick={() => setShowFallback((v) => !v)}
            className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {c.fallbackLabel} / {c.fallbackLabelBn}
          </button>
          {showFallback && <div className="w-full">{fallback}</div>}
        </div>
      )}
    </div>
  );
}
