"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  BadgeDollarSign,
  DollarSign,
  FolderKanban,
  Gauge,
  Import,
  Loader2,
  Settings2,
  ShoppingCart,
  Building2,
  BarChart3,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

export function DashboardHomeView() {
  const s = useDashboardStats();
  const [lang, setLang] = useState<"en" | "bn">("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("bdcr7-language") : null;
    if (stored === "bn" || stored === "en") {
      setLang(stored);
      return;
    }
    if (typeof document !== "undefined") {
      setLang(document.documentElement.lang === "bn" ? "bn" : "en");
    }
  }, []);

  const text = useMemo(() => {
    if (lang === "bn") {
      return {
        quickActions: "দ্রুত মডিউল অ্যাকশন",
        todayFocus: "আজকের ফোকাস",
        pendingApprovals: "অপেক্ষমান অনুমোদন",
        activeProjects: "চলমান প্রজেক্ট",
        currentBalance: "বর্তমান ব্যালেন্স",
        openFinance: "ফাইন্যান্স খুলুন",
      };
    }
    return {
      quickActions: "Quick Module Actions",
      todayFocus: "Today Focus",
      pendingApprovals: "Pending approvals",
      activeProjects: "Active projects",
      currentBalance: "Current balance",
      openFinance: "Open Finance",
    };
  }, [lang]);

  const quickStats = [
    { label: lang === "bn" ? "মোট ফান্ড" : "Funds Received", value: fmt(s.totalFundsReceived), icon: Wallet, tone: "emerald" },
    { label: lang === "bn" ? "বর্তমান ব্যালেন্স" : "Current Balance", value: fmt(s.currentBalance), icon: Gauge, tone: "blue" },
    { label: lang === "bn" ? "মোট ব্যয়" : "Total Expenses", value: fmt(s.totalExpenses), icon: DollarSign, tone: "rose" },
    { label: lang === "bn" ? "অপেক্ষমান ব্যয়" : "Pending Expenses", value: String(s.pendingExpenses), icon: AlertTriangle, tone: "amber" },
  ];

  const actionCards = [
    {
      title: lang === "bn" ? "প্রজেক্ট" : "Projects",
      href: "/dashboard/construction/projects",
      icon: FolderKanban,
      blurb: lang === "bn" ? `${s.totalProjects} টি প্রজেক্ট চলমান` : `${s.totalProjects} projects in pipeline`,
    },
    {
      title: lang === "bn" ? "ফাইন্যান্স" : "Finance",
      href: "/dashboard/finance",
      icon: BadgeDollarSign,
      blurb: lang === "bn" ? `${s.pendingApprovals} টি অনুমোদন বাকি` : `${s.pendingApprovals} approvals pending`,
    },
    {
      title: "POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      blurb: lang === "bn" ? "বিক্রয়, বিলিং ও স্টক" : "Retail billing and stock movement",
    },
    {
      title: lang === "bn" ? "সাইট প্রগ্রেস" : "Site Progress",
      href: "/dashboard/construction",
      icon: Building2,
      blurb: lang === "bn" ? "শ্রমিক, উপকরণ, কাজের অগ্রগতি" : "Workers, materials, progress",
    },
    {
      title: lang === "bn" ? "ইমপোর্ট" : "Import",
      href: "/dashboard/import",
      icon: Import,
      blurb: lang === "bn" ? "এলসি, শিপমেন্ট ও সাপ্লাই" : "LC, shipment and supply flow",
    },
    {
      title: lang === "bn" ? "রিপোর্ট" : "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      blurb: lang === "bn" ? "অ্যানালিটিক্স ও এক্সপোর্ট" : "Export-ready operational summaries",
    },
    {
      title: "SUMONIX AI",
      href: "/dashboard/ai",
      icon: Bot,
      blurb: lang === "bn" ? "চ্যাট সহকারী ও ইনসাইট" : "AI assistant and insights",
    },
    {
      title: lang === "bn" ? "সেটিংস" : "Settings",
      href: "/dashboard/settings",
      icon: Settings2,
      blurb: lang === "bn" ? "ইউজার ও অ্যাপ কনফিগারেশন" : "Access controls and workspace setup",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {quickStats.map(({ label, value, icon: Icon, tone }) => (
          <motion.div key={label} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl
                    ${tone === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                    ${tone === "blue"    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : ""}
                    ${tone === "rose"    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : ""}
                    ${tone === "amber"   ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : ""}
                  `}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                {s.loading
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                }
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actionCards.map(({ title, href, icon: Icon, blurb }) => (
            <Link key={title} href={href} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/60 focus-visible:outline-offset-2">
              <div className="flex h-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 transition-all active:scale-[0.99] hover:border-primary/35 hover:shadow-soft">
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{blurb}</p>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text.todayFocus}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            {text.pendingApprovals}: <span className="font-semibold text-foreground">{s.pendingApprovals}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            {text.activeProjects}: <span className="font-semibold text-foreground">{s.totalProjects}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            {text.currentBalance}: <span className="font-semibold text-foreground">{fmt(s.currentBalance)}</span>
          </div>
          <Link href="/dashboard/finance">
            <Button className="mt-2 h-11 w-full">{text.openFinance}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
