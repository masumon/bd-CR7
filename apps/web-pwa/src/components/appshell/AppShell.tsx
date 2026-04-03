"use client";

import { useMemo, useState } from "react";
import { BadgeDollarSign, BarChart3, Bot, FolderKanban, Home, Import, Settings2, ShoppingCart } from "lucide-react";

import { TopBar } from "@/components/appshell/TopBar";
import { BottomNav } from "@/components/appshell/BottomNav";
import { Sidebar } from "@/components/appshell/Sidebar";

import type { NavItem } from "./types";

type AppShellProps = {
  children: React.ReactNode;
  dark: boolean;
  language: "en" | "bn";
  online: boolean;
  unread: number;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
};

export function AppShell({ children, dark, language, online, unread, onToggleTheme, onToggleLanguage, onOpenNotifications }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(() => {
    const labels = language === "bn"
      ? ["হোম", "প্রজেক্ট", "ফাইন্যান্স", "ইমপোর্ট", "POS", "রিপোর্ট", "AI", "সেটিংস"]
      : ["Home", "Projects", "Finance", "Import", "POS", "Reports", "AI", "Settings"];

    return [
      { href: "/dashboard", label: labels[0], icon: Home },
      { href: "/dashboard/construction/projects", label: labels[1], icon: FolderKanban },
      { href: "/dashboard/finance", label: labels[2], icon: BadgeDollarSign },
      { href: "/dashboard/import", label: labels[3], icon: Import },
      { href: "/dashboard/pos", label: labels[4], icon: ShoppingCart },
      { href: "/dashboard/reports", label: labels[5], icon: BarChart3 },
      { href: "/dashboard/ai", label: labels[6], icon: Bot },
      { href: "/dashboard/settings", label: labels[7], icon: Settings2 },
    ];
  }, [language]);

  const bottomItems = navItems.slice(0, 5);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopBar
        title={language === "bn" ? "BD CR7 ERP" : "BD CR7 ERP"}
        online={online}
        unread={unread}
        dark={dark}
        language={language}
        onMenu={() => setMobileOpen(true)}
        onToggleTheme={onToggleTheme}
        onToggleLanguage={onToggleLanguage}
        onOpenNotifications={onOpenNotifications}
      />

      <Sidebar items={navItems} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <main className="px-3 pb-[calc(56px+env(safe-area-inset-bottom))] pt-[calc(56px+8px)] lg:ml-16 lg:pb-4">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <BottomNav items={bottomItems} />
    </div>
  );
}
