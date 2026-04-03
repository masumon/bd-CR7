"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BadgeDollarSign,
  Bot,
  Building2,
  ClipboardList,
  DollarSign,
  FolderKanban,
  Gauge,
  HardHat,
  Loader2,
  Settings2,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useState } from "react";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

export function DashboardHomeView() {
  const s = useDashboardStats();
  const [activeModule, setActiveModule] = useState<null | {
    title: string;
    blurb: string;
    href: string;
    stats: string[];
    details: string[];
  }>(null);

  const quickStats = [
    { label: "Funds Received", value: fmt(s.totalFundsReceived), icon: Wallet, tone: "emerald" },
    { label: "Current Balance",  value: fmt(s.currentBalance),      icon: Gauge,         tone: "blue"    },
    { label: "Total Expenses",   value: fmt(s.totalExpenses),        icon: DollarSign,    tone: "rose"    },
    { label: "Pending Expenses", value: String(s.pendingExpenses),   icon: AlertTriangle, tone: "amber"   },
  ];

  const summaryCards = [
    { label: "Total Workers",    value: String(s.totalWorkers),        icon: HardHat      },
    { label: "Total Projects",   value: String(s.totalProjects),       icon: FolderKanban },
    { label: "Expense Entries",  value: String(s.totalExpenseEntries), icon: ClipboardList },
    { label: "Pending Approvals",value: String(s.pendingApprovals),    icon: Activity     },
  ];

  const workstreams = [
    {
      title: "Project Introduction",
      href: "/dashboard/construction/projects",
      icon: FolderKanban,
      blurb: "Project profile, phase ladder, schedule, and budget identity",
      stats: [`${s.totalProjects} total projects`, "Planning to handover visibility"],
      details: [
        "বাংলা: প্রকল্পের নাম, বাজেট, ধাপ, সময়সীমা এবং ভিজ্যুয়াল কভার এক স্ক্রিনে সাজানো থাকে।",
        "English: Project identity, budget, and phase progression stay together for fast executive review.",
      ],
    },
    {
      title: "Fund & Expense",
      href: "/dashboard/finance",
      icon: BadgeDollarSign,
      blurb: "Fund intake, expense control, approval routing, and ledger discipline",
      stats: [`${s.pendingApprovals} pending approvals`, `${fmt(s.totalExpenses)} total expenses`],
      details: [
        "বাংলা: ফান্ড ম্যানেজমেন্ট ও ব্যয় অনুমোদন একই workflow-এ পরিচালনা করুন",
        "English: Manage fund accounts, expenses, and approvals from one finance cockpit",
      ],
    },
    {
      title: "Site Progress",
      href: "/dashboard/construction",
      icon: Building2,
      blurb: "Worker logs, material stock, phase evidence, and daily execution rhythm",
      stats: [`${s.totalWorkers} active workers`, "Site readiness tracking"],
      details: [
        "বাংলা: শ্রমিক, উপকরণ ও প্রগ্রেস মিডিয়া প্রমাণ এক জায়গায় দেখুন",
        "English: Track field operations with worker/material/progress continuity",
      ],
    },
    {
      title: "Import & Supply",
      href: "/dashboard/import",
      icon: ArrowRightLeft,
      blurb: "Shipment stages, landed cost, customs queue",
      stats: ["L/C pipeline management"],
      details: [
        "বাংলা: L/C রেকর্ড, আগমনের তারিখ, স্ট্যাটাস এবং সাপ্লাই ফ্লো পরিচালনা করুন",
        "English: Manage import milestones from LC opening to shipment closure",
      ],
    },
    {
      title: "Retail POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      blurb: "Catalog, cart operations, stock awareness, and cashier-ready checkout",
      stats: ["Catalog, cart, checkout, history"],
      details: [
        "বাংলা: দ্রুত checkout, cart control এবং sales tracking",
        "English: Real-time POS flow with product, cart, and checkout visibility",
      ],
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: Activity,
      blurb: "Cross-module analytics, trends, and CSV exports",
      stats: ["7d / 30d / 90d insights"],
      details: [
        "বাংলা: এক্সপেন্স, উপকরণ ও ফাইন্যান্স ডেটার রিপোর্ট দ্রুত এক্সপোর্ট করুন",
        "English: Download decision-ready CSV and track operational trendlines",
      ],
    },
    {
      title: "SUMONIX AI",
      href: "/dashboard/ai",
      icon: Bot,
      blurb: "Ready-to-use ERP assistant for summaries, anomalies, and guided actions",
      stats: ["Bilingual prompts", "Risk and dashboard assistance"],
      details: [
        "বাংলা: SUMONIX AI এখন চ্যাটবটের মতো দ্রুত প্রশ্নের উত্তর, সারাংশ এবং পরামর্শ দেবে।",
        "English: SUMONIX AI is positioned as a ready assistant instead of a hidden tool panel.",
      ],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings2,
      blurb: "User profile, language, theme, and workspace control settings",
      stats: ["Theme and language shortcuts"],
      details: [
        "বাংলা: প্রোফাইল, ভাষা, থিম এবং সেশন সেটিংস এক জায়গা থেকে নিয়ন্ত্রণ করুন।",
        "English: Keep identity, preferences, and session controls in one place.",
      ],
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

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                {s.loading
                  ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                  : <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
                }
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workstream Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workstreams.map(({ title, href, icon: Icon, blurb, stats }) => (
          <Card key={title} className="overflow-hidden border-border/70 transition-all hover:-translate-y-1 hover:shadow-soft">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Module / মডিউল</p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">{title}</h3>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{blurb}</p>
              <div className="space-y-1.5">
                {stats.map((stat) => (
                  <div key={stat} className="rounded-xl border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                    {stat}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => {
                    const item = workstreams.find((w) => w.title === title);
                    if (!item) return;
                    setActiveModule(item);
                  }}
                >
                  বিস্তারিত
                </Button>
                <Link href={href}>
                  <Button variant="outline" className="w-full h-8 text-xs">Open</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Financial Trend — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {s.loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.monthlySeries}>
                  <defs>
                    <linearGradient id="fundFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f6c5a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0f6c5a" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `৳${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, undefined]} />
                  <Area type="monotone" dataKey="fund" name="Funds" stroke="#0f6c5a" strokeWidth={2} fill="url(#fundFill)" />
                  <Area type="monotone" dataKey="expense" name="Expenses" stroke="#dc2626" strokeWidth={2} fill="url(#expFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : s.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent activity yet.</p>
            ) : (
              s.recentActivity.map((item, i) => (
                <div key={i} className="relative pl-4 text-xs text-muted-foreground leading-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  {item}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(activeModule)}
        onClose={() => setActiveModule(null)}
        title={activeModule ? `${activeModule.title} Details` : "Module Details"}
      >
        {activeModule ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">{activeModule.blurb}</p>
            <div className="grid gap-2">
              {activeModule.details.map((line) => (
                <div key={line} className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  {line}
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              {activeModule.stats.map((stat) => (
                <div key={stat} className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  {stat}
                </div>
              ))}
            </div>
            <Link href={activeModule.href} onClick={() => setActiveModule(null)}>
              <Button className="h-9 w-full">Go To Module</Button>
            </Link>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
