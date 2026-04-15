"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Loader2, UploadCloud } from "lucide-react";

import useOfflineQueue from "@/store/offlineQueue";
import { cn } from "@/lib/utils";

type SyncState = "offline" | "pending" | "syncing" | "done";

type SyncBadgeProps = {
  online: boolean;
  language?: "en" | "bn";
};

export function SyncBadge({ online, language = "en" }: SyncBadgeProps) {
  const queue = useOfflineQueue((s) => s.queue);
  const pendingCount = queue.length;

  const [syncState, setSyncState] = useState<SyncState>("done");

  useEffect(() => {
    if (!online) {
      setSyncState("offline");
      return;
    }
    if (pendingCount > 0) {
      setSyncState("pending");
      return;
    }
    // Brief "syncing" flash when queue just cleared (online + count just hit 0)
    setSyncState("done");
  }, [online, pendingCount]);

  // Show syncing animation briefly when queue clears while online
  const [prevCount, setPrevCount] = useState(pendingCount);
  useEffect(() => {
    if (prevCount > 0 && pendingCount === 0 && online) {
      setSyncState("syncing");
      const t = setTimeout(() => setSyncState("done"), 1800);
      return () => clearTimeout(t);
    }
    setPrevCount(pendingCount);
  }, [pendingCount, online, prevCount]);

  // Don't render when fully synced and online (clean UI)
  if (syncState === "done" && online && pendingCount === 0) return null;

  const labels: Record<SyncState, { en: string; bn: string }> = {
    offline: { en: "Offline", bn: "অফলাইন" },
    pending: { en: `${pendingCount} pending`, bn: `${pendingCount}টি বাকি` },
    syncing: { en: "Syncing…", bn: "সিঙ্ক হচ্ছে…" },
    done:    { en: "Synced", bn: "সিঙ্ক সম্পন্ন" },
  };

  const label = language === "bn" ? labels[syncState].bn : labels[syncState].en;

  return (
    <span
      className={cn(
        "sync-badge",
        syncState === "offline" && "sync-badge-offline",
        syncState === "pending" && "sync-badge-pending",
        syncState === "syncing" && "sync-badge-syncing",
        syncState === "done"    && "sync-badge-done",
      )}
      aria-live="polite"
      aria-label={label}
      title={label}
    >
      {syncState === "offline" && <CloudOff className="h-3 w-3" />}
      {syncState === "pending" && <UploadCloud className="h-3 w-3" />}
      {syncState === "syncing" && <Loader2 className="h-3 w-3 animate-spin" />}
      {syncState === "done"    && <CheckCircle2 className="h-3 w-3" />}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
