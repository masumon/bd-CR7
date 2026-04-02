"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BadgeDollarSign,
  Building2,
  ClipboardList,
  DollarSign,
  FolderKanban,
  Gauge,
  HardHat,
  Loader2,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

  const summaryCards = [
    { label: "Total Workers",    value: String(s.totalWorkers),        icon: HardHat      },
    { label: "Total Projects",   value: String(s.totalProjects),       icon: FolderKanban },
    { label: "Expense Entries",  value: String(s.totalExpenseEntries), icon: ClipboardList },
    { label: "Pending Approvals",value: String(s.pendingApprovals),    icon: Activity     },
  ];

  const workstreams = [
    {
      title: "Finance Core",
      href: "/dashboard/finance",
      icon: BadgeDollarSign,
      blurb: "Fund intake, expense control, approval routing",
      stats: [`${s.pendingApprovals} pending approvals`, `${fmt(s.totalExpenses)} total expenses`],
    },
    {
      title: "Projects",
      href: "/dashboard/construction/projects",
      icon: FolderKanban,
      blurb: "Project CRUD, budgets, phases, work updates",
      stats: [`${s.totalProjects} total projects`],
    },
    {
      title: "Construction Ops",
      href: "/dashboard/construction",
      icon: Building2,
      blurb: "Worker logs, material stock, progress",
      stats: [`${s.totalWorkers} active workers`],
    },
    {
      title: "Import & Supply",
      href: "/dashboard/import",
      icon: ArrowRightLeft,
      blurb: "Shipment stages, landed cost, customs queue",
      stats: ["L/C pipeline management"],
    },
    {
      title: "Retail POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      blurb: "Sales velocity, cart operations, outlet readiness",
      stats: ["Cart & SKU tracking"],
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {workstreams.map(({ title, href, icon: Icon, blurb, stats }) => (
          <Card key={title} className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Module</p>
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
              <Link href={href}>
                <Button variant="outline" className="w-full text-xs h-8 mt-1">Open</Button>
              </Link>
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
    </div>
  );
}
