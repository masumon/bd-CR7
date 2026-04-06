"use client";

import { Bell, Languages, Menu, Moon, Sun, ChevronDown } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopBarProps = {
  title: string;
  online: boolean;
  unread: number;
  dark: boolean;
  language: "en" | "bn";
  role?: string | null;
  onMenu: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
  onOpenUserDrawer: () => void;
};

export function TopBar({ title, online, unread, dark, language, role, onMenu, onToggleTheme, onToggleLanguage, onOpenNotifications, onOpenUserDrawer }: TopBarProps) {
  const initials = role ? role.slice(0, 2).toUpperCase() : "U";

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-14 border-b border-border/65 bg-background/88 px-2 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-1.5">
        {/* Mobile hamburger */}
        <Button variant="ghost" className="h-11 w-11 p-0 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>

        {/* Logo mark */}
        <div className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm">
          <Image src="/icons/icon.svg" alt="SUMONIX Logo" width={32} height={32} className="h-8 w-8 object-contain" />
        </div>

        {/* Project selector / branding */}
        <div
          className="surface-panel flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2.5 py-1.5"
          aria-label="Current workspace"
        >
          <div className="flex min-w-0 flex-col text-left">
            <p className="truncate font-display text-sm font-semibold text-foreground leading-tight">{title}</p>
            <p className={cn("text-[10px] uppercase tracking-[0.12em] leading-tight", online ? "text-emerald-400" : "text-rose-400")}>
              {online ? "System Online" : "System Offline"}
            </p>
          </div>
          <span className={cn("h-2 w-2 shrink-0 rounded-full", online ? "bg-emerald-400" : "bg-rose-500")} aria-hidden="true" />
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden="true" />
        </div>

        {/* Theme toggle */}
        <Button variant="ghost" className="h-11 w-11 p-0" onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Language toggle */}
        <button
          className="flex h-9 items-center justify-center gap-1 rounded-full border border-border/60 bg-muted/55 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none"
          onClick={onToggleLanguage}
          aria-label="Toggle language"
        >
          <Languages className="h-3 w-3" />
          <span>{language === "bn" ? "বাং" : "EN"}</span>
        </button>

        {/* Notifications */}
        <Button variant="ghost" className="relative h-11 w-11 p-0" onClick={onOpenNotifications} aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>

        {/* User avatar */}
        <button
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
            "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-sm",
            "transition hover:opacity-90 active:scale-95"
          )}
          onClick={onOpenUserDrawer}
          aria-label="Open user profile"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
