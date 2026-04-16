"use client";

import { useMemo, useState } from "react";
import useOfflineQueue from "@/store/offlineQueue";
import {
  BadgeDollarSign,
  BarChart3,
  BookOpenText,
  Bot,
  Briefcase,
  Building2,
  ClipboardList,
  FolderKanban,
  HardHat,
  Home,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { TopBar } from "@/components/appshell/TopBar";
import { BottomNav } from "@/components/appshell/BottomNav";
import { MoreDrawer } from "@/components/appshell/MoreDrawer";
import { Sidebar } from "@/components/appshell/Sidebar";
import { UserDrawer } from "@/components/appshell/UserDrawer";
import { CORE_MAIN_DASHBOARD_PATHS } from "@/lib/dashboardPolicy";
import { ROLE_ACCESS, normalizeRoleName } from "@/lib/rbac";
import { cn } from "@/lib/utils";

import type { NavItem } from "./types";

type AppShellProps = {
  children: React.ReactNode;
  dark: boolean;
  language: "en" | "bn";
  online: boolean;
  unread: number;
  role?: string | null;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
};

export function AppShell({ children, dark, language, online, unread, role, onToggleTheme, onToggleLanguage, onOpenNotifications }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pendingSyncCount = useOfflineQueue((state) => state.queue.length);
  const normalizedRole = normalizeRoleName(role);
  const corePathSet = useMemo<Set<string>>(() => new Set(CORE_MAIN_DASHBOARD_PATHS), []);
  const allowedPaths = useMemo(
    () => new Set(ROLE_ACCESS[normalizedRole] ?? ROLE_ACCESS.viewer),
    [normalizedRole]
  );

  // Single-language label: picks English or Bengali based on current language setting
  const t = (en: string, bn: string) => language === "bn" ? bn : en;

  const coreItems = useMemo<NavItem[]>(() => {
    return [
      { href: "/dashboard", label: t("Dashboard", "ড্যাশবোর্ড"), icon: Home },
      { href: "/dashboard/docs", label: t("Guide", "ইউজার গাইড"), icon: BookOpenText },
      { href: "/dashboard/construction/projects", label: t("Projects", "প্রজেক্ট"), icon: FolderKanban },
      { href: "/dashboard/finance", label: t("Finance", "ফাইন্যান্স"), icon: BadgeDollarSign },
      { href: "/dashboard/workforce", label: t("Workforce", "শ্রমিক"), icon: HardHat },
      { href: "/dashboard/materials", label: t("Materials", "মালামাল"), icon: Building2 },
      { href: "/dashboard/evidence", label: t("Evidence", "ডকুমেন্ট"), icon: ClipboardList },
      { href: "/dashboard/reports", label: t("Reports", "রিপোর্ট"), icon: BarChart3 },
      { href: "/dashboard/ai", label: "SUMONIX AI", icon: Bot },
      { href: "/dashboard/audit", label: t("Audit", "অডিট"), icon: ShieldCheck },
      { href: "/dashboard/contractor", label: t("Contractor", "ঠিকাদার"), icon: Briefcase },
      { href: "/dashboard/settings", label: t("Settings", "সেটিংস"), icon: Settings2 },
    ].filter((item) => corePathSet.has(item.href) && allowedPaths.has(item.href));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedPaths, corePathSet, language]);

  const navItems = coreItems;

  // Bottom nav primary slots: Dashboard, Projects, Finance, Workforce (max 4)
  const BOTTOM_PRIMARY = [
    "/dashboard",
    "/dashboard/construction/projects",
    "/dashboard/finance",
    "/dashboard/workforce",
  ];

  const bottomPrimaryItems = useMemo<NavItem[]>(() => {
    const selected = BOTTOM_PRIMARY
      .map((href) => coreItems.find((item) => item.href === href))
      .filter(Boolean) as NavItem[];

    if (selected.length >= 4) return selected.slice(0, 4);
    const fallback = coreItems.filter((item) => !selected.some((s) => s.href === item.href));
    return [...selected, ...fallback].slice(0, 4);
  }, [coreItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // "More" drawer items: everything not in the 4 primary slots
  const moreItems = useMemo<NavItem[]>(() => {
    const primaryHrefs = new Set(bottomPrimaryItems.map((i) => i.href));
    return coreItems.filter((item) => !primaryHrefs.has(item.href));
  }, [coreItems, bottomPrimaryItems]);

  const roleLabel = (normalizedRole || "viewer")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <div className="relative min-h-dvh app-gradient text-foreground">
      <TopBar
        title="BD CR7 ERP"
        online={online}
        unread={unread}
        dark={dark}
        language={language}
        role={role}
        onMenu={() => setMobileOpen(true)}
        onToggleTheme={onToggleTheme}
        onToggleLanguage={onToggleLanguage}
        onOpenNotifications={onOpenNotifications}
        onOpenUserDrawer={() => setUserDrawerOpen(true)}
      />

      <Sidebar items={navItems} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <main className="app-main-scroll page-enter px-3 lg:ml-64 lg:px-5 lg:pb-5">
        <div className="mx-auto max-w-6xl">
          <div className="module-surface shadow-soft relative z-[1] min-h-[calc(100dvh-72px-72px-env(safe-area-inset-bottom)-env(safe-area-inset-top))] overflow-visible rounded-[1.75rem] border border-border/45 p-3 backdrop-blur-[3px] lg:min-h-[calc(100dvh-72px-28px)] lg:p-3.5">
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border/45 pb-3">
              <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-primary">
                {language === "bn" ? `রোল · ${roleLabel}` : `ROLE · ${roleLabel}`}
              </span>
              <span className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium",
                online
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border border-amber-500/20 bg-amber-500/10 text-amber-300"
              )}>
                {online ? (language === "bn" ? "লাইভ সংযোগ" : "Live connection") : (language === "bn" ? "অফলাইন মোড" : "Offline mode")}
              </span>
              {pendingSyncCount > 0 ? (
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-300">
                  {language === "bn" ? `${pendingSyncCount}টি পরিবর্তন সিঙ্ক অপেক্ষায়` : `${pendingSyncCount} change(s) waiting to sync`}
                </span>
              ) : null}
            </div>
            {children}
          </div>
        </div>
      </main>

      <BottomNav
        items={bottomPrimaryItems}
        moreItems={moreItems}
        onOpenMore={() => setMoreOpen(true)}
      />

      <MoreDrawer
        open={moreOpen}
        items={moreItems}
        onClose={() => setMoreOpen(false)}
        language={language}
      />

      <UserDrawer
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        language={language}
      />
    </div>
  );
}

