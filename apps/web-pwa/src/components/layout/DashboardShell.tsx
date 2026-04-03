"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  Factory,
  FolderKanban,
  Home,
  Import,
  Menu,
  Moon,
  Search,
  Settings2,
  ShoppingCart,
  Sun,
  UserCircle2,
  Wifi,
  WifiOff,
  Languages,
  LogOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FloatingChat } from "@/features/sumonix_ai_ui/FloatingChat";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const copy = {
  en: {
    brand: "BD CR7 Ultra",
    controlRoom: "Control Room",
    home: "Home",
    searchPlaceholder: "Search modules, activity, or alerts",
    online: "Online",
    offline: "Offline",
    offlineNote: "Offline mode active. Actions will queue and sync automatically.",
    admin: "Admin",
    settings: "Settings",
    workspace: "Workspace Settings",
    workspaceBody: "Control your dashboard appearance, language, and session from one place.",
    appearance: "Appearance",
    appearanceBody: "Choose the color mode that is easiest to use in office, site, or installed PWA mode.",
    language: "Language",
    languageBody: "Switch dashboard labels and helper text between Bangla and English.",
    session: "Session",
    sessionBody: "Logout clears the active session and returns to the login page.",
    light: "Light",
    dark: "Dark",
    bangla: "বাংলা",
    english: "English",
    logout: "Logout",
    navigation: "Navigation",
    collapse: "Collapse",
    expand: "Expand",
    categories: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/construction", label: "Construction", icon: Building2 },
      { href: "/dashboard/finance", label: "Finance", icon: BadgeDollarSign },
      { href: "/dashboard/import", label: "Import", icon: Import },
      { href: "/dashboard/pos", label: "POS", icon: ShoppingCart },
      { href: "/dashboard/construction/projects", label: "Projects", icon: FolderKanban },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
    ],
  },
  bn: {
    brand: "BD CR7 Ultra",
    controlRoom: "কন্ট্রোল রুম",
    home: "হোম",
    searchPlaceholder: "মডিউল, activity বা alert খুঁজুন",
    online: "অনলাইন",
    offline: "অফলাইন",
    offlineNote: "অফলাইন মোড চালু আছে। সব action queue হয়ে পরে sync হবে।",
    admin: "অ্যাডমিন",
    settings: "সেটিংস",
    workspace: "ড্যাশবোর্ড সেটিংস",
    workspaceBody: "এক জায়গা থেকে dashboard appearance, language এবং session control করুন।",
    appearance: "থিম",
    appearanceBody: "অফিস, site বা installed PWA mode-এর জন্য সুবিধাজনক color mode বেছে নিন।",
    language: "ভাষা",
    languageBody: "Dashboard label এবং helper text বাংলা বা English-এ পরিবর্তন করুন।",
    session: "সেশন",
    sessionBody: "Logout করলে active session clear হয়ে login page-এ ফিরে যাবে।",
    light: "লাইট",
    dark: "ডার্ক",
    bangla: "বাংলা",
    english: "English",
    logout: "লগআউট",
    navigation: "নেভিগেশন",
    collapse: "ছোট করুন",
    expand: "বড় করুন",
    categories: [
      { href: "/dashboard", label: "ড্যাশবোর্ড", icon: Home },
      { href: "/dashboard/construction", label: "কনস্ট্রাকশন", icon: Building2 },
      { href: "/dashboard/finance", label: "ফাইন্যান্স", icon: BadgeDollarSign },
      { href: "/dashboard/import", label: "ইমপোর্ট", icon: Import },
      { href: "/dashboard/pos", label: "পস", icon: ShoppingCart },
      { href: "/dashboard/construction/projects", label: "প্রজেক্ট", icon: FolderKanban },
      { href: "/dashboard/reports", label: "রিপোর্ট", icon: BarChart3 },
      { href: "/dashboard/settings", label: "সেটিংস", icon: Settings2 },
    ],
  },
} as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [online, setOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bdcr7-theme");
    const storedLanguage = window.localStorage.getItem("bdcr7-language");
    if (storedTheme === "dark") {
      setDark(true);
    } else if (storedTheme === "light") {
      setDark(false);
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    if (storedLanguage === "bn" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    window.localStorage.setItem("bdcr7-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("bdcr7-language", language);
  }, [language]);

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

  const text = copy[language];
  const nav = text.categories;

  const crumb = useMemo(() => {
    const activeItem = nav.find((item) => item.href === pathname);
    if (activeItem) return activeItem.label;
    const cleaned = pathname.split("/").filter(Boolean).filter((segment) => segment !== "dashboard");
    if (cleaned.length === 0) return nav[0].label;
    return cleaned.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(" / ");
  }, [nav, pathname]);

  const handleLogout = () => {
    logout();
    setSettingsOpen(false);
    setMenuOpen(false);
    router.push("/login");
  };

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
            {!collapsed ? <span className="text-sm font-semibold">{text.brand}</span> : null}
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
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? text.expand : text.collapse}
            </Button>
            {!collapsed ? (
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" /> {text.settings}
              </Button>
            ) : null}
          </div>
        </aside>

        <div className="min-h-[100svh] flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-card/75 px-4 py-3 backdrop-blur safe-top safe-x">
            {!online ? (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                {text.offlineNote}
              </div>
            ) : null}
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
              <Button variant="ghost" className="px-3 lg:hidden" aria-label="Open navigation drawer" onClick={() => setMenuOpen((v) => !v)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1 md:flex-none">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{text.controlRoom}</p>
                <div className="truncate text-sm text-muted-foreground">{text.home} / <span className="font-medium text-foreground">{crumb}</span></div>
              </div>
              <div className="order-last flex w-full items-center gap-2 rounded-2xl border border-border bg-background/90 px-3 py-3 md:order-none md:mx-auto md:max-w-md md:flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder={text.searchPlaceholder} aria-label="Global search" />
              </div>
              <Button variant="ghost" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark((v) => !v)}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" aria-label={text.language} onClick={() => setLanguage((value) => (value === "en" ? "bn" : "en"))}>
                <Languages className="h-4 w-4" />
              </Button>
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs md:flex">
                {online ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
                {online ? text.online : text.offline}
              </div>
              <button type="button" className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-all active:scale-95 hover:shadow-soft sm:flex" onClick={() => setSettingsOpen(true)}>
                <UserCircle2 className="h-4 w-4" />
                {role || text.admin}
              </button>
            </div>
          </header>

          {menuOpen ? (
            <div className="fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] border-r border-border bg-card/95 p-4 backdrop-blur-lg lg:hidden safe-top safe-bottom safe-x">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{text.navigation}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{text.brand}</p>
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
              <div className="mt-4 grid gap-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setSettingsOpen(true)}>
                  <Settings2 className="h-4 w-4" /> {text.settings}
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/25" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> {text.logout}
                </Button>
              </div>
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
          <div className="mx-auto grid max-w-3xl grid-cols-8 gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-medium transition-all", pathname === href ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="mb-1 h-4 w-4" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <FloatingChat />

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title={text.workspace}>
        <div className="space-y-4">
          <div className="rounded-[1.4rem] border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{text.settings}</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{text.workspace}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.workspaceBody}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
                <p className="text-xs uppercase tracking-[0.14em]">Role</p>
                <p className="mt-2 font-semibold text-foreground">{role || text.admin}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
                <p className="text-xs uppercase tracking-[0.14em]">User ID</p>
                <p className="mt-2 truncate font-semibold text-foreground">{userId || "-"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{text.appearance}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text.appearanceBody}</p>
              </div>
              {dark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant={dark ? "ghost" : "outline"} onClick={() => setDark(false)}>{text.light}</Button>
              <Button type="button" variant={dark ? "outline" : "ghost"} onClick={() => setDark(true)}>{text.dark}</Button>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{text.language}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text.languageBody}</p>
              </div>
              <Languages className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant={language === "bn" ? "outline" : "ghost"} onClick={() => setLanguage("bn")}>{text.bangla}</Button>
              <Button type="button" variant={language === "en" ? "outline" : "ghost"} onClick={() => setLanguage("en")}>{text.english}</Button>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{text.session}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text.sessionBody}</p>
              </div>
              <LogOut className="h-4 w-4 text-rose-500" />
            </div>
            <Button type="button" className="mt-4 w-full bg-rose-600 text-white shadow-none hover:opacity-95 dark:bg-rose-500 dark:text-white" onClick={handleLogout}>
              {text.logout}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
