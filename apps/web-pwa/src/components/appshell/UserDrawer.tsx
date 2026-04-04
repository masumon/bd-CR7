"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Mail, ShieldCheck, User, Activity, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

type UserDrawerProps = {
  open: boolean;
  onClose: () => void;
  language: "en" | "bn";
};

const copy = {
  en: {
    profile: "Profile",
    role: "Role",
    email: "Email",
    activity: "Activity",
    activityBody: "Session active",
    logout: "Logout",
    close: "Close",
    settings: "Settings",
    unassigned: "Unassigned",
  },
  bn: {
    profile: "প্রোফাইল",
    role: "রোল",
    email: "ইমেইল",
    activity: "অ্যাক্টিভিটি",
    activityBody: "সেশন সক্রিয়",
    logout: "লগআউট",
    close: "বন্ধ করুন",
    settings: "সেটিংস",
    unassigned: "নির্ধারিত নয়",
  },
} as const;

export function UserDrawer({ open, onClose, language }: UserDrawerProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);

  const t = copy[language];

  const handleLogout = () => {
    logout();
    onClose();
    router.replace("/login");
  };

  const initials = role ? role.slice(0, 2).toUpperCase() : "U";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label={t.close}
          />
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 right-0 top-0 z-50 w-72 border-l border-border bg-background/95 shadow-2xl backdrop-blur-md"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{t.profile}</p>
                <button
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition",
                    "hover:bg-muted hover:text-foreground"
                  )}
                  onClick={onClose}
                  aria-label={t.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Avatar + Name */}
              <div className="flex flex-col items-center gap-3 border-b border-border px-4 py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-xl font-bold text-primary-foreground shadow-lg">
                  {initials}
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">{role || t.unassigned}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">BD CR7 ERP</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="flex-1 space-y-px overflow-y-auto px-3 py-3">
                <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{t.role}</p>
                    <p className="text-sm font-medium text-foreground">{role || t.unassigned}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <User className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">User ID</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{userId || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <Activity className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{t.activity}</p>
                    <p className="text-sm text-foreground">{t.activityBody}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 border-t border-border px-4 py-4">
                <Link
                  href="/dashboard/settings"
                  onClick={onClose}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {t.settings}
                </Link>
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
