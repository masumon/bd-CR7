"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/appshell/AppShell";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/ui/ConsistencySystem";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AppLockScreen, useAppLock } from "@/components/auth/AppLockScreen";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/authSession";
import { emitNetworkStatus, probeNetworkReachability } from "@/lib/networkReachability";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuthStore } from "@/store/authStore";
import type { OfflineSyncSummary } from "@/lib/offlineSync";

const ChatWidget = dynamic(
  () => import("@/components/ui/ChatWidget").then((module) => module.ChatWidget),
  { ssr: false }
);

type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

/** Resolve initial dark mode: stored preference → system preference → dark */
function resolveInitialDark(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem("bdcr7-theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  // "system" or unset → follow OS preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Lock screen to portrait if the Screen Orientation API is available. */
function lockPortrait() {
  if (typeof screen === "undefined" || !screen.orientation) return;
  const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  if (typeof so.lock !== "function") return;
  so.lock("portrait-primary").catch(() => {
    // Best-effort — some browsers/desktop environments reject this.
  });
}

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const hydrated = useAuthStore((state) => state.hydrated);
  const initializing = useAuthStore((state) => state.initializing);
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);
  const authError = useAuthStore((state) => state.error);
  const router = useRouter();
  const toast = useToast();

  const [dark, setDark] = useState(true);
  const [language, setLanguage] = useState<"en" | "bn">("bn");
  const [online, setOnline] = useState(true);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [sessionRetryCount, setSessionRetryCount] = useState(0);
  const loaderStartedAtRef = useRef<number>(Date.now());

  // App-level biometric/password lock — activates when app is minimized or backgrounded
  const appLock = useAppLock();

  const unread = notifications.length;

  useEffect(() => {
    loaderStartedAtRef.current = Date.now();
    void initialize();
  }, [initialize]);

  // PHASE 10 — Theme: stored preference or system preference
  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("bdcr7-language");
    setDark(resolveInitialDark());
    if (storedLanguage === "bn" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }

    // Listen for OS-level theme changes when preference is "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemTheme = (e: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem("bdcr7-theme");
      if (!stored || stored === "system") {
        setDark(e.matches);
      }
    };
    mq.addEventListener("change", onSystemTheme);
    return () => mq.removeEventListener("change", onSystemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    // Preserve existing stored preference key; only update if not "system"
    const stored = window.localStorage.getItem("bdcr7-theme");
    if (stored !== "system") {
      window.localStorage.setItem("bdcr7-theme", dark ? "dark" : "light");
    }
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("bdcr7-language", language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    const syncReachability = async (source: string) => {
      const reachable = await probeNetworkReachability();
      if (!cancelled) {
        setOnline(reachable);
        emitNetworkStatus({ online: reachable, source });
      }
    };

    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    void syncReachability("shell-mount");

    const onOnline = () => {
      void syncReachability("browser-online");
    };
    const onOffline = () => {
      void syncReachability("browser-offline");
    };
    const onNetworkStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ online?: boolean }>).detail;
      if (typeof detail?.online === "boolean") {
        setOnline(detail.online);
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("bdcr7:network-status", onNetworkStatus as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("bdcr7:network-status", onNetworkStatus as EventListener);
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      toast.warning(
        language === "bn" ? "সেশন শেষ হয়েছে" : "Session expired",
        language === "bn"
          ? "আবার সাইন ইন করুন।"
          : "Please sign in again.",
      );
    };

    window.addEventListener("bdcr7:auth-expired", onExpired as EventListener);
    return () => {
      window.removeEventListener("bdcr7:auth-expired", onExpired as EventListener);
    };
  }, [language, toast]);

  // PHASE 11 — Lock screen orientation to portrait
  useEffect(() => {
    lockPortrait();
  }, []);

  useEffect(() => {
    const onQueued = () => {
      toast.warning(
        language === "bn" ? "অফলাইনে সংরক্ষিত" : "Saved offline",
        language === "bn"
          ? "ইন্টারনেট ফিরলে পরিবর্তনটি স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।"
          : "This change was queued and will sync automatically when you're back online.",
      );
    };

    const onSyncResult = (event: Event) => {
      const detail = (event as CustomEvent<OfflineSyncSummary>).detail;
      if (!detail || detail.processed === 0) return;

      if (detail.succeeded > 0 && detail.requeued === 0 && detail.discarded === 0) {
        toast.success(
          language === "bn" ? "সিঙ্ক সম্পন্ন" : "Sync complete",
          language === "bn"
            ? `${detail.succeeded}টি পরিবর্তন সফলভাবে আপলোড হয়েছে।`
            : `${detail.succeeded} queued change(s) uploaded successfully.`,
        );
        return;
      }

      if (detail.requeued > 0 || detail.discarded > 0) {
        toast.warning(
          language === "bn" ? "সিঙ্ক আংশিক সম্পন্ন" : "Sync incomplete",
          language === "bn"
            ? `সফল: ${detail.succeeded}, বাকি: ${detail.remaining}${detail.lastError ? `, সমস্যা: ${detail.lastError}` : ""}`
            : `Succeeded: ${detail.succeeded}, remaining: ${detail.remaining}${detail.lastError ? `, issue: ${detail.lastError}` : ""}`,
        );
      }
    };

    window.addEventListener("bdcr7:request-queued", onQueued as EventListener);
    window.addEventListener("bdcr7:sync-result", onSyncResult as EventListener);
    return () => {
      window.removeEventListener("bdcr7:request-queued", onQueued as EventListener);
      window.removeEventListener("bdcr7:sync-result", onSyncResult as EventListener);
    };
  }, [language, toast]);

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;

    const push = (title: string, body: string) => {
      const row: DashboardNotification = {
        id: crypto.randomUUID(),
        title,
        body,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [row, ...prev].slice(0, 20));
    };

    const channel = client
      .channel(`bdcr7-mobile-notify-${userId || "anonymous"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "approvals" }, () => push("Approval / অনুমোদন", "নতুন অনুমোদন কিউ-তে যোগ হয়েছে"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "expenses" }, () => push("Expense / খরচ", "নতুন খরচ যুক্ত হয়েছে"))
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [userId]);

  const notificationContent = useMemo(
    () => (
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-card/45 px-3 py-4 text-center text-xs text-muted-foreground">
            {language === "bn" ? "কোনো নোটিফিকেশন নেই" : "No notifications"}
          </p>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/70 bg-card/80 px-3 py-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">{item.title}</p>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{item.body}</p>
            </div>
          ))
        )}
        <Button variant="outline" className="w-full" onClick={() => setNotifications([])}>
          {language === "bn" ? "সব ক্লিয়ার করুন" : "Clear all"}
        </Button>
      </div>
    ),
    [language, notifications]
  );

  const showBlockingShellLoader = !hydrated || (initializing && !userId);
  const loaderExceededFallbackWindow = showBlockingShellLoader && (Date.now() - loaderStartedAtRef.current > 15_000);

  if (showBlockingShellLoader && !loaderExceededFallbackWindow) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4 text-sm text-muted-foreground">
        <div className="w-full max-w-sm rounded-[2rem] border border-border/70 bg-card/82 p-5 text-center shadow-soft backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <div className="h-6 w-6 animate-pulse rounded-xl bg-primary/30" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {language === "bn" ? "ড্যাশবোর্ড প্রস্তুত হচ্ছে" : "Preparing your dashboard"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "bn" ? "সেশন, রোল ও অফলাইন স্টেট রিস্টোর করা হচ্ছে।" : "Restoring session, role and offline state."}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-14 animate-pulse rounded-2xl bg-muted/65" />
            <div className="h-14 animate-pulse rounded-2xl bg-muted/45" />
            <div className="h-14 animate-pulse rounded-2xl bg-muted/65" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/85">
            {language === "bn" ? "মোবাইল/PWA লেআউট fit-to-screen কনফিগার করা হচ্ছে।" : "Applying fit-to-screen mobile/PWA layout."}
          </p>
        </div>
      </div>
    );
  }

  if (loaderExceededFallbackWindow && !userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4 text-sm text-muted-foreground">
        <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
          <ErrorCard
            message={language === "bn"
              ? "সেশন রিস্টোর হতে বেশি সময় লাগছে। আবার লগইন করুন।"
              : "Session restore is taking too long. Please sign in again."}
            onRetry={() => {
              setSessionRetryCount((count) => count + 1);
              void initialize();
            }}
            retryLabel={language === "bn" ? "আবার চেষ্টা করুন" : "Retry session"}
          />
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => router.replace("/login")}>
              {language === "bn" ? "লগইন" : "Sign in"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.refresh()}>
              {language === "bn" ? "রিলোড" : "Reload"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    const retryDisabled = sessionRetryCount >= 2;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4 text-sm text-muted-foreground">
        <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
          <ErrorCard
            message={authError || SESSION_EXPIRED_MESSAGE}
            onRetry={retryDisabled ? undefined : () => {
              setSessionRetryCount((count) => count + 1);
              void initialize();
            }}
            retryLabel={retryDisabled ? "Retry limit reached" : "Retry session"}
          />
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => router.replace("/login")}>Sign in</Button>
            <Button variant="outline" className="flex-1" onClick={() => router.refresh()}>Reload</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Biometric / password lock overlay — shown after app is backgrounded */}
      {appLock.locked && <AppLockScreen onUnlock={appLock.unlock} />}

      <AppShell
        dark={dark}
        language={language}
        online={online}
        unread={unread}
        role={role}
        onToggleTheme={() => setDark((v) => !v)}
        onToggleLanguage={() => setLanguage((v) => (v === "en" ? "bn" : "en"))}
        onOpenNotifications={() => setOpenNotifications(true)}
      >
        {children}
      </AppShell>

      <Dialog open={openNotifications} onClose={() => setOpenNotifications(false)} title={language === "bn" ? "নোটিফিকেশন" : "Notifications"}>
        {notificationContent}
      </Dialog>

      {/* Global floating AI chat — visible on all dashboard pages */}
      <ChatWidget />
    </>
  );
}
