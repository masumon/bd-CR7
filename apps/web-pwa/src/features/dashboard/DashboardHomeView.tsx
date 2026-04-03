"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeDollarSign,
  DollarSign,
  FolderKanban,
  Gauge,
  Loader2,
  Settings2,
  ShoppingCart,
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

  const quickStats = [
    { label: "Funds Received", value: fmt(s.totalFundsReceived), icon: Wallet, tone: "emerald" },
    { label: "Current Balance",  value: fmt(s.currentBalance),      icon: Gauge,         tone: "blue"    },
    { label: "Total Expenses",   value: fmt(s.totalExpenses),        icon: DollarSign,    tone: "rose"    },
    { label: "Pending Expenses", value: String(s.pendingExpenses),   icon: AlertTriangle, tone: "amber"   },
  ];

  const actionCards = [
    {
      title: "Projects",
      href: "/dashboard/construction/projects",
      icon: FolderKanban,
      blurb: `${s.totalProjects} projects in pipeline`,
    },
    {
      title: "Finance",
      href: "/dashboard/finance",
      icon: BadgeDollarSign,
      blurb: `${s.pendingApprovals} approvals pending`,
    },
    {
      title: "POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      blurb: "Retail billing and stock movement",
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: Gauge,
      blurb: "Export-ready operational summaries",
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings2,
      blurb: "Access controls and workspace setup",
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
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          <CardTitle className="text-base">Today Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            Pending approvals: <span className="font-semibold text-foreground">{s.pendingApprovals}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            Active projects: <span className="font-semibold text-foreground">{s.totalProjects}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            Current balance: <span className="font-semibold text-foreground">{fmt(s.currentBalance)}</span>
          </div>
          <Link href="/dashboard/finance">
            <Button className="mt-2 h-9 w-full">Open Finance Desk</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
