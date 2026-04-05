"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Building2,
  ClipboardList,
  HardHat,
  Plus,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ERPModuleStatusGrid } from "@/components/ui/ERPModuleStatusGrid";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const PIE_COLORS = ["hsl(167,46%,46%)", "hsl(40,93%,64%)", "hsl(210,80%,56%)", "hsl(0,72%,51%)"];

function KpiSkeleton() {
  return (
    <div className="glass rounded-2xl border p-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-7 w-7 rounded-xl bg-muted" />
      </div>
      <div className="mt-2 h-5 w-20 rounded bg-muted" />
    </div>
  );
}

const T = {
  en: {
    welcome: "Welcome to BD CR7 ERP",
    subtitle: "Construction · Finance · AI-Powered",
    budget: "Total Budget",
    cost: "Total Cost",
    balance: "Balance",
    workers: "Workers",
    progress: "Project Progress",
    completion: "Overall Completion",
    quickActions: "Quick Actions",
    addExpense: "Add Expense",
    addWorker: "Add Worker",
    upload: "Upload",
    addMaterial: "Add Material",
    expenseBreakdown: "Expense Breakdown",
    weeklySpend: "Weekly Spending",
    progressVsCost: "Progress vs Cost",
    fundFlow: "Fund Flow",
    fund: "Fund",
    expense: "Expense",
    approval: "Approval",
    activity: "Activity Feed",
    aiPanel: "SUMONIX AI",
    aiPrompt: "Ask anything about your project...",
    noActivity: "No recent activity",
  },
  bn: {
    welcome: "BD CR7 ERP-তে স্বাগতম",
    subtitle: "নির্মাণ · অর্থায়ন · AI-চালিত",
    budget: "মোট বাজেট",
    cost: "মোট ব্যয়",
    balance: "ব্যালেন্স",
    workers: "শ্রমিক",
    progress: "প্রজেক্ট অগ্রগতি",
    completion: "সামগ্রিক সম্পন্ন",
    quickActions: "দ্রুত কার্যক্রম",
    addExpense: "খরচ যোগ",
    addWorker: "শ্রমিক যোগ",
    upload: "আপলোড",
    addMaterial: "মালামাল যোগ",
    expenseBreakdown: "ব্যয় বিশ্লেষণ",
    weeklySpend: "সাপ্তাহিক ব্যয়",
    progressVsCost: "অগ্রগতি বনাম ব্যয়",
    fundFlow: "ফান্ড প্রবাহ",
    fund: "ফান্ড",
    expense: "ব্যয়",
    approval: "অনুমোদন",
    activity: "কার্যক্রম ফিড",
    aiPanel: "SUMONIX AI",
    aiPrompt: "আপনার প্রজেক্ট সম্পর্কে যেকোনো প্রশ্ন করুন...",
    noActivity: "কোনো সাম্প্রতিক কার্যক্রম নেই",
  },
} as const;

export function DashboardHomeView() {
  const s = useDashboardStats();
  const [lang, setLang] = useState<"en" | "bn">("en");

  useEffect(() => {
    // Read language from localStorage after hydration to avoid server/client mismatch
    const stored = window.localStorage.getItem("bdcr7-language");
    if (stored === "bn" || stored === "en") setLang(stored);
    else if (document.documentElement.lang === "bn") setLang("bn");
  }, []);

  const t = T[lang];

  const kpis = [
    { label: t.budget, value: fmt(s.totalFundsReceived), icon: BadgeDollarSign, cls: "kpi-green", iconCls: "text-emerald-400" },
    { label: t.cost, value: fmt(s.totalExpenses), icon: TrendingUp, cls: "kpi-red", iconCls: "text-rose-400" },
    { label: t.balance, value: fmt(s.currentBalance), icon: Wallet, cls: "kpi-gold", iconCls: "text-yellow-400" },
    { label: t.workers, value: String(s.totalWorkers), icon: Users, cls: "kpi-blue", iconCls: "text-blue-400" },
  ];

  const quickActions = [
    { label: t.addExpense, icon: BadgeDollarSign, href: "/dashboard/finance", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
    { label: t.addWorker, icon: HardHat, href: "/dashboard/workforce", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    { label: t.upload, icon: Upload, href: "/dashboard/evidence", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    { label: t.addMaterial, icon: Building2, href: "/dashboard/materials", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  ];

  const activityItems = s.recentActivity?.length ? s.recentActivity : [t.noActivity];

  // Real project progress: ratio of approved expenses vs total funds received (capped 0–100)
  const projectProgress = s.loading || s.totalFundsReceived === 0
    ? 0
    : Math.min(100, Math.round((s.totalExpenses / s.totalFundsReceived) * 100));

  // Real pie data from DB categories; fallback to empty array while loading
  const pieData = s.expenseBreakdown.length > 0 ? s.expenseBreakdown : [];

  // Real monthly bar data from DB
  const monthlyBarData = s.monthlySeries.map((m) => ({ day: m.name, amount: m.expense }));

  // Real progress vs cost line data
  const progressLineData = s.monthlySeries.map((m, i, arr) => {
    const cumExpense = arr.slice(0, i + 1).reduce((acc, x) => acc + x.expense, 0);
    const cumFund = arr.slice(0, i + 1).reduce((acc, x) => acc + x.fund, 0);
    const pct = cumFund > 0 ? Math.min(100, Math.round((cumExpense / cumFund) * 100)) : 0;
    return { month: m.name, progress: pct, cost: cumExpense };
  });

  // Error state
  if (s.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-rose-400" />
        <p className="text-[14px] font-semibold text-foreground">
          {lang === "bn" ? "ডেটা লোড হয়নি" : "Failed to load dashboard"}
        </p>
        <p className="text-[12px] text-muted-foreground">{s.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">

      {/* Welcome Header */}
      <div className="glass rounded-2xl px-4 py-4">
        <h1 className="font-display text-[20px] font-bold text-foreground leading-tight">
          {t.welcome}
        </h1>
        <p className="mt-0.5 text-[12px] text-muted-foreground tracking-wide">{t.subtitle}</p>
      </div>

      {/* ERP Cross-Module Status Grid */}
      <section aria-label="ERP module status">
        <ERPModuleStatusGrid />
      </section>

      {/* KPI Cards — skeleton while loading */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Key performance indicators">
        {s.loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className={`glass rounded-2xl border p-3 ${k.cls}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-[12px] font-medium text-muted-foreground leading-tight">{k.label}</p>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-xl bg-background/50 ${k.iconCls}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-2 font-display text-[16px] font-semibold text-foreground">{k.value}</p>
                </div>
              );
            })}
      </section>

      {/* Project Progress — real computed value */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-foreground">{t.progress}</p>
          <span className="text-[12px] font-medium text-primary">{projectProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-700"
            style={{ width: `${projectProgress}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">{t.completion}: {projectProgress}%</p>
      </div>

      {/* Quick Actions — Next.js Link for client-side navigation */}
      <section>
        <p className="mb-2 px-1 text-[14px] font-semibold text-foreground">{t.quickActions}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-[13px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${a.color}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-background/40">
                  <Icon className="h-4 w-4" />
                </span>
                {a.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Charts Row — real DB data */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Pie Chart — real expense category breakdown */}
        <div className="glass rounded-2xl p-4">
          <p className="mb-3 text-[14px] font-semibold text-foreground">{t.expenseBreakdown}</p>
          {pieData.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              {s.loading ? "Loading..." : lang === "bn" ? "কোনো ডেটা নেই" : "No expense data yet"}
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart aria-label={t.expenseBreakdown}>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="text-[11px] font-medium text-foreground">{fmt(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart — real monthly expense data */}
        <div className="glass rounded-2xl p-4">
          <p className="mb-3 text-[14px] font-semibold text-foreground">{t.weeklySpend}</p>
          {monthlyBarData.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              {s.loading ? "Loading..." : lang === "bn" ? "কোনো ডেটা নেই" : "No data yet"}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={monthlyBarData} barSize={8} aria-label={t.weeklySpend}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [fmt(v), "Amount"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Line Chart — real cumulative progress vs cost */}
      <div className="glass rounded-2xl p-4">
        <p className="mb-3 text-[14px] font-semibold text-foreground">{t.progressVsCost}</p>
        {progressLineData.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted-foreground">
            {s.loading ? "Loading..." : lang === "bn" ? "কোনো ডেটা নেই" : "No data yet"}
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={progressLineData} aria-label={t.progressVsCost}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                />
                <Line type="monotone" dataKey="progress" stroke="hsl(167,46%,46%)" strokeWidth={2} dot={false} name="Progress %" />
                <Line type="monotone" dataKey="cost" stroke="hsl(40,93%,64%)" strokeWidth={2} dot={false} name="Cost ৳" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground">Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-yellow-400" />
                <span className="text-[11px] text-muted-foreground">Cost</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fund Flow */}
      <div className="glass rounded-2xl p-4">
        <p className="mb-3 text-[14px] font-semibold text-foreground">{t.fundFlow}</p>
        <div className="flex items-center justify-between">
          {[
            { label: t.fund, icon: Wallet, color: "bg-emerald-400/15 text-emerald-400 border-emerald-400/25" },
            { label: t.expense, icon: BadgeDollarSign, color: "bg-yellow-400/15 text-yellow-400 border-yellow-400/25" },
            { label: t.approval, icon: ClipboardList, color: "bg-blue-400/15 text-blue-400 border-blue-400/25" },
          ].map((step, i, arr) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 ${step.color}`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed + AI Panel */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Activity Feed */}
        <div className="glass rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <p className="text-[14px] font-semibold text-foreground">{t.activity}</p>
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <ul className="divide-y divide-border/40">
            {activityItems.slice(0, 5).map((item, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-[13px] text-foreground leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI Panel — honest label, rule-based system */}
        <div className="glass rounded-2xl">
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
            <Bot className="h-4 w-4 text-primary" />
            <p className="text-[14px] font-semibold text-foreground">{t.aiPanel}</p>
            <span className="ml-auto rounded-full bg-blue-400/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              {lang === "bn" ? "বিশ্লেষণ" : "Analytics"}
            </span>
          </div>
          <div className="p-4">
            <p className="mb-3 text-[12px] text-muted-foreground leading-relaxed">
              {lang === "bn"
                ? "AI আপনার প্রজেক্টের ডেটা বিশ্লেষণ করে insights দিচ্ছে।"
                : "Analyzes your project data and surfaces finance, risk, and operational insights."}
            </p>
            <Link
              href="/dashboard/ai"
              className="btn-gold flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold"
            >
              <Bot className="h-4 w-4" />
              {lang === "bn" ? "AI চ্যাট খুলুন" : "Open AI Chat"}
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
