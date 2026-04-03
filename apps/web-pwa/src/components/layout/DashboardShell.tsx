"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  BarChart3,
  Bot,
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
import { ROLE_ACCESS, normalizeRoleName } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const copy = {
  en: {
    brand: "BD CR7 Progress OS",
    controlRoom: "Construction Control Room",
    home: "Home",
    searchPlaceholder: "Search workspace, module, or action",
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
    activeRole: "Active Role",
    moduleFlow: "Module Flow",
    sections: [
      {
        title: "Core Workspace",
        items: [
          { href: "/dashboard", label: "Dashboard", sublabel: "6-command overview", icon: Home },
          { href: "/dashboard/construction/projects", label: "Project Intro", sublabel: "Project identity and phases", icon: FolderKanban },
          { href: "/dashboard/construction", label: "Site Progress", sublabel: "Workers, materials, progress", icon: Building2 },
        ],
      },
      {
        title: "Finance & Commerce",
        items: [
          { href: "/dashboard/finance", label: "Fund & Expense", sublabel: "Cashflow, ledger, approvals", icon: BadgeDollarSign },
          { href: "/dashboard/import", label: "Supply Chain", sublabel: "L/C, import, shipment", icon: Import },
          { href: "/dashboard/pos", label: "POS Workspace", sublabel: "Catalog, cart, sales, stock", icon: ShoppingCart },
        ],
      },
      {
        title: "Insight & Control",
        items: [
          { href: "/dashboard/reports", label: "Reports", sublabel: "Analytics and export desk", icon: BarChart3 },
          { href: "/dashboard/ai", label: "SUMONIX AI", sublabel: "Ready assistant and analysis", icon: Bot },
          { href: "/dashboard/settings", label: "Settings", sublabel: "Profile, theme, language", icon: Settings2 },
        ],
      },
    ],
  },
  bn: {
    brand: "BD CR7 Progress OS",
    controlRoom: "নির্মাণ কন্ট্রোল রুম",
    home: "হোম",
    searchPlaceholder: "ওয়ার্কস্পেস, মডিউল বা অ্যাকশন খুঁজুন",
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
    activeRole: "সক্রিয় রোল",
    moduleFlow: "মডিউল ধারা",
    sections: [
      {
        title: "মূল ওয়ার্কস্পেস",
        items: [
          { href: "/dashboard", label: "ড্যাশবোর্ড", sublabel: "৬ কমান্ড সারসংক্ষেপ", icon: Home },
          { href: "/dashboard/construction/projects", label: "প্রকল্প পরিচিতি", sublabel: "প্রকল্প তথ্য ও ধাপ", icon: FolderKanban },
          { href: "/dashboard/construction", label: "সাইট অগ্রগতি", sublabel: "শ্রমিক, মালামাল, প্রগতি", icon: Building2 },
        ],
      },
      {
        title: "ফাইন্যান্স ও বাণিজ্য",
        items: [
          { href: "/dashboard/finance", label: "তহবিল ও খরচ", sublabel: "ক্যাশফ্লো, লেজার, অনুমোদন", icon: BadgeDollarSign },
          { href: "/dashboard/import", label: "সাপ্লাই চেইন", sublabel: "L/C, ইমপোর্ট, শিপমেন্ট", icon: Import },
          { href: "/dashboard/pos", label: "পজ ওয়ার্কস্পেস", sublabel: "ক্যাটালগ, কার্ট, বিক্রয়, স্টক", icon: ShoppingCart },
        ],
      },
      {
        title: "বিশ্লেষণ ও নিয়ন্ত্রণ",
        items: [
          { href: "/dashboard/reports", label: "রিপোর্ট", sublabel: "বিশ্লেষণ ও এক্সপোর্ট ডেস্ক", icon: BarChart3 },
          { href: "/dashboard/ai", label: "SUMONIX AI", sublabel: "রেডি সহকারী ও বিশ্লেষণ", icon: Bot },
          { href: "/dashboard/settings", label: "সেটিংস", sublabel: "প্রোফাইল, থিম, ভাষা", icon: Settings2 },
        ],
      },
    ],
  },
} as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [online, setOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
  const normalizedRole = normalizeRoleName(role);
  const allowed = ROLE_ACCESS[normalizedRole] || ROLE_ACCESS.viewer;
  const navSections = text.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed.includes(item.href)),
    }))
    .filter((section) => section.items.length > 0);
  const nav = navSections.flatMap((section) => section.items);

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

  if (!hydrated || authLoading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-aura">
        <div className="rounded-2xl border border-border/70 bg-card/75 px-6 py-4 text-sm text-muted-foreground backdrop-blur">
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-aura">
      {menuOpen ? <button type="button" aria-label="Close navigation drawer" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden" onClick={() => setMenuOpen(false)} /> : null}

      <div className="mx-auto flex min-h-[100svh] max-w-[1700px]">
        <aside
          className={cn(
            "sticky top-0 hidden h-[100svh] border-r border-border/70 bg-card/72 p-3 backdrop-blur-xl lg:block",
            collapsed ? "w-20" : "w-64"
          )}
        >
          <div className="mb-5 rounded-[1.5rem] border border-border/70 bg-background/72 px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Factory className="h-5 w-5" />
              </span>
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{text.brand}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{text.moduleFlow}</span>
                </span>
              ) : null}
            </div>
            {!collapsed ? (
              <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/6 px-3 py-3 text-xs text-muted-foreground">
                <p className="uppercase tracking-[0.16em]">{text.activeRole}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{role || "unassigned"}</p>
              </div>
            ) : null}
          </div>
          <nav className="space-y-3">
            {navSections.map((section) => (
              <div key={section.title}>
                {!collapsed ? <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{section.title}</p> : null}
                <div className="space-y-1">
                  {section.items.map(({ href, label, sublabel, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all active:scale-95",
                        pathname === href ? "bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(15,108,90,0.22)]" : "text-muted-foreground hover:bg-muted/72 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? (
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{label}</span>
                          <span className={cn("block truncate text-[11px]", pathname === href ? "text-primary-foreground/80" : "text-muted-foreground")}>{sublabel}</span>
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
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
          <header className="sticky top-0 z-30 border-b border-border/70 bg-card/72 px-4 py-3 backdrop-blur-xl safe-top safe-x">
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
              <div className="order-last flex w-full items-center gap-2 rounded-[1.35rem] border border-border bg-background/88 px-3 py-3 md:order-none md:mx-auto md:max-w-md md:flex-1">
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
              <button type="button" className="hidden items-center gap-2 rounded-[1.15rem] border border-border bg-background px-3 py-2 text-sm transition-all active:scale-95 hover:shadow-soft sm:flex" onClick={() => setSettingsOpen(true)}>
                <UserCircle2 className="h-4 w-4" />
                {role || "unassigned"}
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
              <nav className="grid gap-3">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{section.title}</p>
                    <div className="grid gap-2">
                      {section.items.map(({ href, label, sublabel, icon: Icon }) => (
                        <Link key={href} href={href} className={cn("rounded-2xl border px-4 py-3 text-sm transition-all active:scale-95", pathname === href ? "border-primary/25 bg-primary/10 text-foreground" : "border-border bg-background/85 text-muted-foreground hover:bg-muted hover:text-foreground")}>
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{label}</span>
                              <span className="block truncate text-xs text-muted-foreground">{sublabel}</span>
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
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
              className="mx-auto w-full max-w-7xl p-4 pb-36 sm:p-6 sm:pb-40 lg:pb-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-2 py-2 backdrop-blur-xl safe-bottom safe-x lg:hidden">
          <div className="mx-auto flex max-w-5xl items-stretch gap-1.5 overflow-x-auto pb-1">
          {nav.map(({ href, label, sublabel, icon: Icon }) => (
            <Link key={href} href={href} className={cn("flex min-h-14 min-w-[82px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl px-2 text-[10px] font-medium transition-all", pathname === href ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/72 hover:text-foreground")}>
              <Icon className="mb-1 h-4 w-4" />
              <span className="w-full truncate text-center">{label}</span>
              <span className={cn("hidden w-full truncate text-center text-[10px] sm:block", pathname === href ? "text-primary-foreground/80" : "text-muted-foreground")}>{sublabel}</span>
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
                <p className="mt-2 font-semibold text-foreground">{role || "unassigned"}</p>
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
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                title={text.light}
                aria-label={text.light}
                onClick={() => setDark(false)}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                  dark ? "border-border bg-background text-muted-foreground" : "border-primary/35 bg-primary/10 text-primary"
                )}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={text.dark}
                aria-label={text.dark}
                onClick={() => setDark(true)}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                  dark ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                )}
              >
                <Moon className="h-4 w-4" />
              </button>
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
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                title={text.bangla}
                aria-label={text.bangla}
                onClick={() => setLanguage("bn")}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                  language === "bn" ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                )}
              >
                <Languages className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={text.english}
                aria-label={text.english}
                onClick={() => setLanguage("en")}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                  language === "en" ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                )}
              >
                <Languages className="h-4 w-4" />
              </button>
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
