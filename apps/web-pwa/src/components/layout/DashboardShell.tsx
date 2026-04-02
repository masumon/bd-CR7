"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  Building2,
  Factory,
  Home,
  Import,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  UserCircle2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FloatingChat } from "@/features/sumonix_ai_ui/FloatingChat";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/construction", label: "Construction", icon: Building2 },
  { href: "/dashboard/finance", label: "Finance", icon: BadgeDollarSign },
  { href: "/dashboard/import", label: "Import", icon: Import },
  { href: "/dashboard/pos", label: "POS", icon: ShoppingCart },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [online, setOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bdcr7-theme");
    if (storedTheme === "dark") {
      setDark(true);
      return;
    }
    if (storedTheme === "light") {
      setDark(false);
      return;
    }
    setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    window.localStorage.setItem("bdcr7-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const crumb = useMemo(() => {
    const activeItem = nav.find((item) => item.href === pathname);
    if (activeItem) return activeItem.label;
    const cleaned = pathname.split("/").filter(Boolean).filter((segment) => segment !== "dashboard");
    if (cleaned.length === 0) return "Dashboard";
    return cleaned.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(" / ");
  }, [pathname]);

  return (
    <div className="min-h-[100svh] bg-aura">
      {menuOpen ? <button type="button" aria-label="Close navigation drawer" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden" onClick={() => setMenuOpen(false)} /> : null}

      <div className="mx-auto flex min-h-[100svh] max-w-[1700px]">
        <aside
          className={cn(
            "sticky top-0 hidden h-[100svh] border-r border-border/70 bg-card/80 p-3 backdrop-blur lg:block",
            collapsed ? "w-20" : "w-64"
          )}
        >
          <div className="mb-5 flex items-center gap-2 px-2 py-3">
            <Factory className="h-5 w-5 text-primary" />
            {!collapsed ? <span className="text-sm font-semibold">BD CR7 Ultra</span> : null}
          </div>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all active:scale-95",
                  pathname === href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed ? <span>{label}</span> : null}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? "Expand" : "Collapse"}
            </Button>
          </div>
        </aside>

        <div className="min-h-[100svh] flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-card/75 px-4 py-3 backdrop-blur safe-top safe-x">
            {!online ? (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Offline mode active. Actions will queue and sync automatically.
              </div>
            ) : null}
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
              <Button variant="ghost" className="px-3 lg:hidden" aria-label="Open navigation drawer" onClick={() => setMenuOpen((v) => !v)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1 md:flex-none">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Control Room</p>
                <div className="truncate text-sm text-muted-foreground">Home / <span className="font-medium text-foreground">{crumb}</span></div>
              </div>
              <div className="order-last flex w-full items-center gap-2 rounded-2xl border border-border bg-background/90 px-3 py-3 md:order-none md:mx-auto md:max-w-md md:flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Search modules, activity, or alerts" aria-label="Global search" />
              </div>
              <Button variant="ghost" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark((v) => !v)}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs md:flex">
                {online ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
                {online ? "Online" : "Offline"}
              </div>
              <button type="button" className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-all active:scale-95 hover:shadow-soft sm:flex">
                <UserCircle2 className="h-4 w-4" />
                Admin
              </button>
            </div>
          </header>

          {menuOpen ? (
            <div className="fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] border-r border-border bg-card/95 p-4 backdrop-blur-lg lg:hidden safe-top safe-bottom safe-x">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Navigation</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">BD CR7 Ultra</p>
                </div>
                <Button variant="ghost" className="px-3" onClick={() => setMenuOpen(false)} aria-label="Close navigation drawer">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              <nav className="grid gap-2">
                {nav.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all active:scale-95", pathname === href ? "border-primary/25 bg-primary/10 text-foreground" : "border-border bg-background/85 text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto w-full max-w-7xl p-4 pb-28 sm:p-6 sm:pb-32 lg:pb-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-2 py-2 backdrop-blur-lg safe-bottom safe-x lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-medium transition-all", pathname === href ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="mb-1 h-4 w-4" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <FloatingChat />
    </div>
  );
}
