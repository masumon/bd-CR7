"use client";

import { useEffect, useState } from "react";
import { CloudUpload, Clock, Loader2, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setupOfflineSync } from "@/lib/offlineSync";
import { cn } from "@/lib/utils";
import useOfflineQueue from "@/store/offlineQueue";

const SYNC_TIMEOUT_MS = 1500;

export function SyncControlPanel({ language }: { language: "en" | "bn" }) {
  const queue = useOfflineQueue((s) => s.queue);
  const clearQueue = useOfflineQueue((s) => s.clearQueue);
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const stored = localStorage.getItem("bdcr7-last-sync");
    if (stored) setLastSync(new Date(stored));
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!autoSync) return;
    const cleanup = setupOfflineSync();
    return cleanup;
  }, [autoSync]);

  const handleSyncNow = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      const cleanup = setupOfflineSync();
      await new Promise((r) => setTimeout(r, SYNC_TIMEOUT_MS));
      cleanup();
      const now = new Date();
      setLastSync(now);
      localStorage.setItem("bdcr7-last-sync", now.toISOString());
    } finally {
      setSyncing(false);
    }
  };

  const pendingCount = queue.length;
  const L = language;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudUpload className="h-4 w-4 text-primary" />
          {L === "bn" ? "সিঙ্ক কন্ট্রোল প্যানেল" : "Sync Control Panel"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 p-4">
          {isOnline ? <Wifi className="h-5 w-5 shrink-0 text-emerald-500" /> : <WifiOff className="h-5 w-5 shrink-0 text-rose-500" />}
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{isOnline ? (L === "bn" ? "অনলাইন" : "Online") : (L === "bn" ? "অফলাইন" : "Offline")}</p>
            <p className="text-xs text-muted-foreground">
              {isOnline
                ? (L === "bn" ? "ইন্টারনেট সংযোগ সক্রিয়" : "Internet connection is active")
                : (L === "bn" ? "ইন্টারনেট সংযোগ নেই — ডেটা লোকালি সংরক্ষিত" : "No internet — data is saved locally")}
            </p>
          </div>
          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{L === "bn" ? "পেন্ডিং আইটেম" : "Pending Items"}</p>
            <p className="text-xs text-muted-foreground">{L === "bn" ? "সিঙ্ক হওয়ার অপেক্ষায় আছে" : "Waiting to sync when online"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${pendingCount > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
            {pendingCount}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{L === "bn" ? "শেষ সিঙ্ক" : "Last Sync"}</p>
            <p className="text-xs text-muted-foreground">{lastSync ? lastSync.toLocaleString() : (L === "bn" ? "এখনো সিঙ্ক হয়নি" : "Never synced")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{L === "bn" ? "অটো সিঙ্ক" : "Auto Sync"}</p>
            <p className="text-xs text-muted-foreground">{L === "bn" ? "ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে" : "Automatically sync when internet returns"}</p>
          </div>
          <button type="button" onClick={() => setAutoSync((v) => !v)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition", autoSync ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
            {autoSync ? (L === "bn" ? "চালু" : "ON") : (L === "bn" ? "বন্ধ" : "OFF")}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSyncNow} disabled={!isOnline || syncing} className="flex items-center gap-2">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? (L === "bn" ? "সিঙ্ক হচ্ছে..." : "Syncing...") : (L === "bn" ? "এখনই সিঙ্ক করুন" : "Sync Now")}
          </Button>
          {pendingCount > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm(L === "bn" ? `${pendingCount}টি পেন্ডিং আইটেম মুছবেন?` : `Clear ${pendingCount} pending items?`)) {
                  clearQueue();
                }
              }}
              className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
              {L === "bn" ? "কিউ পরিষ্কার করুন" : "Clear Queue"}
            </Button>
          )}
        </div>

        {!isOnline && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{L === "bn" ? "আপনি অফলাইন। সমস্ত পরিবর্তন লোকালি সংরক্ষিত হচ্ছে এবং ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে আপলোড হবে।" : "You are offline. All changes are saved locally and will sync automatically when internet returns."}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
