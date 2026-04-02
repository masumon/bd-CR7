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
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
  }, [dark]);

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
    const cleaned = pathname.replace("/", "") || "dashboard";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-aura">
      <div className="flex">
        <aside
          className={cn(
            "hidden h-screen border-r border-border/70 bg-card/80 p-3 backdrop-blur lg:block",
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
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
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

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur">
            {!online ? (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Offline mode active. Actions will queue and sync automatically.
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="lg:hidden" onClick={() => setMenuOpen((v) => !v)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground">Home / <span className="font-medium text-foreground">{crumb}</span></div>
              <div className="mx-auto flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Global search" />
              </div>
              <Button variant="ghost" onClick={() => setDark((v) => !v)}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs md:flex">
                {online ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
                {online ? "Online" : "Offline"}
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <UserCircle2 className="h-4 w-4" />
                Admin
              </button>
            </div>
          </header>

          {menuOpen ? (
            <div className="border-b border-border bg-card p-3 lg:hidden">
              <nav className="grid gap-2">
                {nav.map(({ href, label }) => (
                  <Link key={href} href={href} className="rounded-lg border border-border px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                    {label}
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
              className="p-4 md:p-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
      <FloatingChat />
    </div>
  );
}
