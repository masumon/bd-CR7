"use client";

import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
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
  const normalizedRole = normalizeRoleName(role);
  const corePathSet = useMemo<Set<string>>(() => new Set(CORE_MAIN_DASHBOARD_PATHS), []);
  const allowedPaths = useMemo(
    () => new Set(ROLE_ACCESS[normalizedRole] ?? ROLE_ACCESS.viewer),
    [normalizedRole]
  );

  const coreItems = useMemo<NavItem[]>(() => {
    const bi = (en: string, bn: string) => `${en} / ${bn}`;
    return [
      { href: "/dashboard", label: bi("Dashboard", "ড্যাশবোর্ড"), icon: Home },
      { href: "/dashboard/construction/projects", label: bi("Projects", "প্রজেক্ট"), icon: FolderKanban },
      { href: "/dashboard/finance", label: bi("Finance", "ফাইন্যান্স"), icon: BadgeDollarSign },
      { href: "/dashboard/workforce", label: bi("Workforce", "শ্রমিক"), icon: HardHat },
      { href: "/dashboard/materials", label: bi("Materials", "মালামাল"), icon: Building2 },
      { href: "/dashboard/evidence", label: bi("Evidence", "ডকুমেন্ট"), icon: ClipboardList },
      { href: "/dashboard/reports", label: bi("Reports", "রিপোর্ট"), icon: BarChart3 },
      { href: "/dashboard/ai", label: "SUMONIX AI", icon: Bot },
      { href: "/dashboard/audit", label: bi("Audit", "অডিট"), icon: ShieldCheck },
      { href: "/dashboard/contractor", label: bi("Contractor", "ঠিকাদার"), icon: Briefcase },
      { href: "/dashboard/settings", label: bi("Settings", "সেটিংস"), icon: Settings2 },
    ].filter((item) => corePathSet.has(item.href) && allowedPaths.has(item.href));
  }, [allowedPaths, corePathSet]);

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

  return (
    <div className="min-h-dvh app-gradient text-foreground">
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

      <main className="page-enter px-3 pb-[calc(56px+env(safe-area-inset-bottom)+0.5rem)] pt-[calc(56px+10px)] lg:ml-16 lg:px-5 lg:pb-5 lg:pt-[calc(56px+14px)]">
        <div className="mx-auto max-w-6xl">
          {/* Fixed-height scrollable content shell.
              min-h ensures very short content never collapses the container;
              overflow-y-auto scrolls tall content without double-scroll on the page.
              On mobile: subtracts TopBar (56 px) + BottomNav (56 px) + safe-area.
              On desktop (lg): subtracts only TopBar + small gap, no BottomNav. */}
          <div
            className="
              min-h-[min(calc(100dvh-56px-76px-env(safe-area-inset-bottom)),480px)]
              max-h-[calc(100dvh-56px-76px-env(safe-area-inset-bottom))]
              overflow-y-auto
              overflow-x-hidden
              rounded-[1.75rem]
              border border-border/45
              bg-[linear-gradient(180deg,rgba(16,24,39,0.22),rgba(16,24,39,0.08))]
              p-2.5
              shadow-[0_14px_30px_rgba(0,0,0,0.22)]
              backdrop-blur-[3px]
              lg:min-h-[calc(100dvh-56px-28px)]
              lg:max-h-[calc(100dvh-56px-28px)]
              lg:p-3.5
            "
          >
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
      />

      <UserDrawer
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        language={language}
      />
    </div>
  );
}

