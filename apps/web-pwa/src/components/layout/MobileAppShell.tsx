"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";

import { AppShell } from "@/components/appshell/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FileUploadEngine } from "@/components/ui/FileUploadEngine";
import { FloatingChat } from "@/features/sumonix_ai_ui/FloatingChat";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

/** Derive ERP module name from current path */
function moduleFromPath(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean);
  const idx = seg.indexOf("dashboard");
  return idx >= 0 && seg[idx + 1] ? seg[idx + 1] : "general";
}

type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const hydrated = useAuthStore((state) => state.hydrated);
  const loading = useAuthStore((state) => state.loading);
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);
  const pathname = usePathname();

  const [dark, setDark] = useState(true);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [online, setOnline] = useState(true);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const unread = notifications.length;

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bdcr7-theme");
    const storedLanguage = window.localStorage.getItem("bdcr7-language");
    setDark(storedTheme ? storedTheme === "dark" : true);
    if (storedLanguage === "bn" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("bdcr7-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("bdcr7-language", language);
  }, [language]);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "approvals" }, () => push("Approval", "New approval queued"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "expenses" }, () => push("Expense", "New expense logged"))
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [userId]);

  const notificationContent = useMemo(
    () => (
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground">No notifications</p>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="rounded-md border border-border bg-card px-2 py-2">
              <p className="text-xs font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.body}</p>
            </div>
          ))
        )}
        <Button variant="outline" className="w-full" onClick={() => setNotifications([])}>
          Clear
        </Button>
      </div>
    ),
    [notifications]
  );

  if (!hydrated || loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <>
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

      {/* ── Global Floating AI (SUMONIX) ────────────────────────────────── */}
      <FloatingChat />

      {/* ── Global Floating Upload Button ───────────────────────────────── */}
      <button
        type="button"
        aria-label="Upload evidence file"
        title="Upload Evidence / File"
        onClick={() => setUploadOpen(true)}
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] right-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-900/50 active:scale-95 transition-transform lg:bottom-6 lg:right-20"
      >
        <Camera className="h-5 w-5 text-white" />
      </button>

      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={language === "bn" ? "ফাইল আপলোড" : "Upload Evidence / File"}
      >
        <div className="pb-2">
          <FileUploadEngine
            module={moduleFromPath(pathname)}
            category="general"
            onUploaded={() => setUploadOpen(false)}
          />
        </div>
      </Dialog>
    </>
  );
}
