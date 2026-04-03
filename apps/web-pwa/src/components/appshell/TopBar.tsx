"use client";

import { Bell, Languages, Menu, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

type TopBarProps = {
  title: string;
  online: boolean;
  unread: number;
  dark: boolean;
  language: "en" | "bn";
  onMenu: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
};

export function TopBar({ title, online, unread, dark, language, onMenu, onToggleTheme, onToggleLanguage, onOpenNotifications }: TopBarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-14 border-b border-border bg-background/95 px-2 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-1">
        <Button variant="ghost" className="h-11 w-11 p-0 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{online ? "online" : "offline"}</p>
        </div>

        <Button variant="ghost" className="h-11 w-11 p-0" onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" className="h-11 w-11 p-0" onClick={onToggleLanguage} aria-label="Toggle language">
          <Languages className="h-4 w-4" />
          <span className="sr-only">{language === "bn" ? "Bangla" : "English"}</span>
        </Button>

        <Button variant="ghost" className="relative h-11 w-11 p-0" onClick={onOpenNotifications} aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
        </Button>
      </div>
    </header>
  );
}
