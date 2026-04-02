"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowRightLeft, BadgeDollarSign, Building2, DollarSign, Gauge, ShoppingCart, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const series = [
  { name: "Jan", fund: 20000, expense: 8000 },
  { name: "Feb", fund: 26000, expense: 11000 },
  { name: "Mar", fund: 30000, expense: 13000 },
  { name: "Apr", fund: 35000, expense: 15000 },
  { name: "May", fund: 37000, expense: 17000 },
  { name: "Jun", fund: 40000, expense: 18500 },
];

const activities = [
  "Dual admin approved expense #EXP-2026-94",
  "POS sync completed for Mirpur showroom",
  "Construction worker attendance geofence verified",
  "Import L/C landed cost updated",
  "AI flagged unusual expense cluster",
];

const workstreams = [
  {
    title: "Finance Core",
    href: "/dashboard/finance",
    icon: BadgeDollarSign,
    blurb: "Fund intake, expense control, approval routing",
    stats: ["7 pending approvals", "$42K in weekly spend"],
  },
  {
    title: "Construction Ops",
    href: "/dashboard/construction",
    icon: Building2,
    blurb: "Worker logs, material stock, progress visibility",
    stats: ["64 workers active", "4 zones reporting live"],
  },
  {
    title: "Import & Supply",
    href: "/dashboard/import",
    icon: ArrowRightLeft,
    blurb: "Shipment stages, landed cost, customs queue",
    stats: ["3 L/C pipelines", "2 customs reviews"],
  },
  {
    title: "Retail POS",
    href: "/dashboard/pos",
    icon: ShoppingCart,
    blurb: "Sales velocity, cart operations, outlet readiness",
    stats: ["6 fast-moving SKUs", "1 outlet sync due"],
  },
];

const alerts = [
  { label: "Approval queue", value: "07", tone: "amber" },
  { label: "Low stock lines", value: "03", tone: "rose" },
  { label: "Import actions", value: "02", tone: "emerald" },
];

export function DashboardHomeView() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white/85 via-white/75 to-primary/5 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-primary/10">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Executive Workspace
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Clear visibility across finance, field execution, supply flow, and retail sales.</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                The dashboard now separates feature categories and operational subcategories so teams can jump straight into the next action instead of scanning flat cards.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {alerts.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone === "amber" ? "bg-amber-100 text-amber-700" : item.tone === "rose" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Control Focus</p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">Today&apos;s command priorities</h3>
              </div>
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-3">Review expense items waiting for checker confirmation before payout release.</div>
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-3">Track low-stock construction materials likely to affect the finishing phase.</div>
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-3">Clear import shipment blockers and align outlet-ready inventory allocation.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { label: "Total Fund", value: "$400,000", icon: Wallet },
          { label: "Total Expense", value: "$212,500", icon: DollarSign },
          { label: "Balance", value: "$187,500", icon: Gauge },
          { label: "Project Completion", value: "68%", icon: Activity },
        ].map((item) => (
          <motion.div key={item.label} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-xs text-muted-foreground">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label === "Project Completion" ? "Cross-functional execution pace" : "Updated from the latest operational feed"}</p>
              <progress
                className="mt-3 h-2 w-full overflow-hidden rounded bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                max={100}
                value={item.label === "Project Completion" ? 68 : 82}
                aria-label={`${item.label} completion`}
              />
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-4">
        {workstreams.map(({ title, href, icon: Icon, blurb, stats }) => (
          <Card key={title} className="overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Category</p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">{title}</h3>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{blurb}</p>
              <div className="space-y-2 text-sm text-foreground">
                {stats.map((stat) => (
                  <div key={stat} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
                    {stat}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full justify-between" onClick={() => { window.location.href = href; }}>
                Open Workspace
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Financial Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="fundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area dataKey="fund" stroke="#2563eb" fill="url(#fundFill)" />
                <Area dataKey="expense" stroke="#dc2626" fill="url(#expFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((item) => (
              <motion.div key={item} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="relative pl-5 text-sm text-muted-foreground">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                {item}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
