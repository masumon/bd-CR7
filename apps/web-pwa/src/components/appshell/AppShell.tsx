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
  PackageOpen,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users2,
  Warehouse,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import type { DynamicModuleKey } from "@/store/moduleStore";

const MODULE_ICONS: Record<DynamicModuleKey, LucideIcon> = {
  import_lc: Truck,
  pos: ShoppingCart,
  crm: Users2,
  contractor: Briefcase,
  inventory_advanced: Warehouse,
};

import { TopBar } from "@/components/appshell/TopBar";
import { BottomNav } from "@/components/appshell/BottomNav";
import { Sidebar } from "@/components/appshell/Sidebar";
import { UserDrawer } from "@/components/appshell/UserDrawer";
import { ROLE_ACCESS, normalizeRoleName } from "@/lib/rbac";
import { useModuleStore } from "@/store/moduleStore";

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
  const enabledModules = useModuleStore((s) => s.enabledModules);
  const normalizedRole = normalizeRoleName(role);
  const allowedPaths = useMemo(
    () => new Set(ROLE_ACCESS[normalizedRole] ?? ROLE_ACCESS.viewer),
    [normalizedRole]
  );

  const dynamicItems = useMemo<NavItem[]>(() => {
    return enabledModules()
      .filter((m) => m.key !== "contractor") // contractor is a core nav item
      .filter((m) => allowedPaths.has(m.href))
      .map((m) => ({
        href: m.href,
        label: language === "bn" ? m.labelBn : m.labelEn,
        icon: MODULE_ICONS[m.key] ?? PackageOpen,
      }));
  }, [allowedPaths, enabledModules, language]);

  const coreItems = useMemo<NavItem[]>(() => {
    const isEn = language === "en";
    return [
      { href: "/dashboard", label: isEn ? "Dashboard" : "ড্যাশবোর্ড", icon: Home },
      { href: "/dashboard/construction/projects", label: isEn ? "Projects" : "প্রজেক্ট", icon: FolderKanban },
      { href: "/dashboard/finance", label: isEn ? "Finance" : "ফাইন্যান্স", icon: BadgeDollarSign },
      { href: "/dashboard/workforce", label: isEn ? "Workforce" : "শ্রমিক", icon: HardHat },
      { href: "/dashboard/materials", label: isEn ? "Materials" : "মালামাল", icon: Building2 },
      { href: "/dashboard/evidence", label: isEn ? "Evidence" : "ডকুমেন্ট", icon: ClipboardList },
      { href: "/dashboard/reports", label: isEn ? "Reports" : "রিপোর্ট", icon: BarChart3 },
      { href: "/dashboard/ai", label: "SUMONIX AI", icon: Bot },
      { href: "/dashboard/audit", label: isEn ? "Audit" : "অডিট", icon: ShieldCheck },
      { href: "/dashboard/contractor", label: isEn ? "Contractor" : "ঠিকাদার", icon: Briefcase },
      { href: "/dashboard/settings", label: isEn ? "Settings" : "সেটিংস", icon: Settings2 },
    ].filter((item) => allowedPaths.has(item.href));
  }, [allowedPaths, language]);

  const navItems = useMemo<NavItem[]>(
    () => [...coreItems, ...dynamicItems],
    [coreItems, dynamicItems]
  );

  // Bottom nav: Dashboard, Projects, Finance, Workforce, Reports
  const bottomItems = useMemo<NavItem[]>(() => {
    const preferred = [
      "/dashboard",
      "/dashboard/construction/projects",
      "/dashboard/finance",
      "/dashboard/workforce",
      "/dashboard/reports",
    ];

    const selected = preferred
      .map((href) => coreItems.find((item) => item.href === href))
      .filter(Boolean) as NavItem[];

    if (selected.length >= 5) {
      return selected.slice(0, 5);
    }

    const fallback = coreItems.filter((item) => !selected.some((s) => s.href === item.href));
    return [...selected, ...fallback].slice(0, 5);
  }, [coreItems]);

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

      <main className="px-3 pb-[calc(56px+env(safe-area-inset-bottom))] pt-[calc(56px+8px)] lg:ml-16 lg:pb-4">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <BottomNav items={bottomItems} />

      <UserDrawer
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        language={language}
      />
    </div>
  );
}
