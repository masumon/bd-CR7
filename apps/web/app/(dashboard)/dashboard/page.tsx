"use client";

import { useRouter } from "next/navigation";
import {
  DollarSign, Users, Package, BarChart2, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { apiClient } from "@/lib/apiClient";
import { useEffect, useState } from "react";
import { ContentSkeleton, ErrorCard, StatCardSkeleton } from "@/components/ui/ConsistencySystem";

// ─── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({
  completed,
  ongoing,
  pending,
}: {
  completed: number;
  ongoing: number;
  pending: number;
}) {
  const size = 84;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const total = completed + ongoing + pending || 1;
  const cPct = completed / total;
  const oPct = ongoing / total;
  const pPct = Math.max(0, 1 - cPct - oPct);
  const base = -90;
  const arc = (pct: number) => pct * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22C55E" strokeWidth={sw}
        strokeDasharray={`${arc(cPct)} ${circ - arc(cPct)}`} strokeLinecap="butt"
        transform={`rotate(${base} ${size / 2} ${size / 2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#60A5FA" strokeWidth={sw}
        strokeDasharray={`${arc(oPct)} ${circ - arc(oPct)}`} strokeLinecap="butt"
        transform={`rotate(${base + cPct * 360} ${size / 2} ${size / 2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FBBF24" strokeWidth={sw}
        strokeDasharray={`${arc(pPct)} ${circ - arc(pPct)}`} strokeLinecap="butt"
        transform={`rotate(${base + (cPct + oPct) * 360} ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#E5E7EB" fontSize="15" fontWeight="700">
        {Math.round(cPct * 100)}%
      </text>
    </svg>
  );
}

// ─── Role display names ────────────────────────────────────────────────────
const ROLE_DISPLAY: Record<string, string> = {
  admin: "অ্যাডমিন",
  manager: "ম্যানেজার",
  supervisor: "সুপারভাইজার",
  worker: "কর্মী",
  accountant: "হিসাবরক্ষক",
};

// ─── Role-based quick action config ───────────────────────────────────────
const ROLE_QUICK_ACTIONS: Record<string, { icon: typeof Package; label: string; sub: string; href: string }[]> = {
  admin: [
    { icon: Package, label: "Material যোগ", sub: "Add Material", href: "/dashboard/materials" },
    { icon: Users, label: "Worker যোগ", sub: "Add Worker", href: "/dashboard/workforce" },
    { icon: DollarSign, label: "খরচ যোগ", sub: "Add Expense", href: "/dashboard/finance" },
    { icon: TrendingUp, label: "Progress আপডেট", sub: "Update", href: "/dashboard/construction" },
  ],
  manager: [
    { icon: DollarSign, label: "খরচ যোগ", sub: "Add Expense", href: "/dashboard/finance" },
    { icon: TrendingUp, label: "Progress আপডেট", sub: "Update", href: "/dashboard/construction" },
    { icon: Package, label: "Material যোগ", sub: "Add Material", href: "/dashboard/materials" },
    { icon: Users, label: "Worker যোগ", sub: "Add Worker", href: "/dashboard/workforce" },
  ],
  accountant: [
    { icon: DollarSign, label: "খরচ যোগ", sub: "Add Expense", href: "/dashboard/finance" },
    { icon: BarChart2, label: "রিপোর্ট দেখুন", sub: "View Reports", href: "/dashboard/reports" },
    { icon: TrendingUp, label: "বাজেট দেখুন", sub: "View Budget", href: "/dashboard/finance" },
    { icon: Package, label: "Material দেখুন", sub: "View Materials", href: "/dashboard/materials" },
  ],
  supervisor: [
    { icon: Users, label: "Worker যোগ", sub: "Add Worker", href: "/dashboard/workforce" },
    { icon: TrendingUp, label: "Progress আপডেট", sub: "Update", href: "/dashboard/construction" },
    { icon: Package, label: "Material দেখুন", sub: "View Materials", href: "/dashboard/materials" },
    { icon: BarChart2, label: "রিপোর্ট", sub: "Reports", href: "/dashboard/reports" },
  ],
  worker: [
    { icon: TrendingUp, label: "Progress আপডেট", sub: "Update", href: "/dashboard/construction" },
    { icon: Package, label: "Material দেখুন", sub: "View Materials", href: "/dashboard/materials" },
  ],
  viewer: [],
};

function formatTaka(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n}`;
}

type ProjectStats = {
  projects: { total: number; completed: number; ongoing: number; pending: number };
  finance: { total_expenses: number; approved_spend: number };
  workforce: { total_workers: number };
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();

  const financeStats = useDashboardStats({ includeDetails: false });
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    setProjectLoading(true);
    setProjectError(null);
    apiClient<ProjectStats>("/api/reports/dashboard", { method: "GET" })
      .then(setProjectStats)
      .catch((error) => {
        setProjectStats(null);
        setProjectError(error instanceof Error ? error.message : "Failed to load dashboard report");
      })
      .finally(() => setProjectLoading(false));
  }, []);

  const completed  = projectStats?.projects.completed ?? 0;
  const ongoing    = projectStats?.projects.ongoing ?? 0;
  const pending    = projectStats?.projects.pending ?? 0;
  const totalProjects = projectStats?.projects.total ?? 0;
  const progressPct = totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0;

  const totalExpenses = financeStats.totalExpenses;
  const totalFunds    = financeStats.totalFundsReceived;
  const remaining     = Math.max(0, totalFunds - totalExpenses);
  const spentPct      = totalFunds > 0 ? Math.round((totalExpenses / totalFunds) * 100) : 0;

  const normalizedRole = role?.toLowerCase() ?? "viewer";
  const quickActions = ROLE_QUICK_ACTIONS[normalizedRole] ?? ROLE_QUICK_ACTIONS.viewer;

  const progressStats = [
    { val: completed, label: "সম্পন্ন",  valueClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { val: ongoing,   label: "চলমান",    valueClass: "text-sky-400",     bgClass: "bg-sky-400/10" },
    { val: pending,   label: "বাকি",     valueClass: "text-amber-400",   bgClass: "bg-amber-400/10" },
  ];

  const displayName = (role && ROLE_DISPLAY[role.toLowerCase()]) ?? role ?? "ম্যানেজার";

  // Core modules — role-aware visibility
  const allCoreModules = [
    { icon: Package, label: "মালামাল", href: "/dashboard/materials" },
    { icon: Users, label: "শ্রমিক", href: "/dashboard/workforce" },
    { icon: DollarSign, label: "খরচ", href: "/dashboard/finance" },
    { icon: BarChart2, label: "অগ্রগতি", href: "/dashboard/construction" },
  ];
  const coreModules = normalizedRole === "worker"
    ? allCoreModules.filter((m) => ["/dashboard/materials", "/dashboard/construction"].includes(m.href))
    : allCoreModules;

  if (financeStats.loading || projectLoading) {
    return (
      <div className="min-h-full overflow-x-hidden bg-background p-3 pb-6 space-y-4">
        <div className="erp-card p-4 space-y-3">
          <div className="skeleton h-6 w-40 rounded-md" />
          <div className="skeleton h-4 w-28 rounded-md" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="erp-card p-4"><StatCardSkeleton count={3} /></div>
          <div className="erp-card p-4"><ContentSkeleton rows={4} withIcon={false} withValue /></div>
        </div>
        <div className="erp-card p-4"><ContentSkeleton rows={6} asGrid /></div>
      </div>
    );
  }

  if ((financeStats.error || projectError) && !projectStats && financeStats.totalProjects === 0 && financeStats.totalExpenses === 0) {
    return (
      <div className="min-h-full overflow-x-hidden bg-background p-3 pb-6">
        <ErrorCard
          message={financeStats.error || projectError || "Dashboard data could not be loaded."}
          onRetry={() => router.refresh()}
          retryLabel="Reload dashboard"
          className="max-w-2xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-background p-3 pb-6">

      {/* ══════════════════════════════════════════
          BENTO GRID LAYOUT
          ────────────────────────────────────────
          Mobile (2 col):
            [header    header   ]  ← full width
            [progress  donut    ]  ← 2 cols
            [budget    budget   ]  ← full width
            [finance   finance  ]  ← full width (LARGE)
            [qa  qa  qa  qa    ]  ← quick actions
            [mod mod mod mod   ]  ← core access
          Desktop (4+ col): side-by-side tiles
      ══════════════════════════════════════════ */}

      <div className="bento-dashboard">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="bento-area-header erp-card p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-erp-text-primary font-semibold text-base leading-snug truncate">
              স্বাগতম, {displayName} 👋
            </h1>
            <p className="text-erp-text-secondary text-xs mt-0.5">
              {totalProjects > 0 ? `${totalProjects} প্রজেক্ট সক্রিয়` : "কোনো প্রজেক্ট নেই"}
            </p>
          </div>
          <span className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-erp-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-erp-accent" />
            চলমান
          </span>
        </div>

        {/* ── PROGRESS BAR ───────────────────────────────── */}
        <div className="bento-area-progress erp-card p-4">
          <p className="text-erp-text-secondary text-xs mb-2">কাজের অগ্রগতি</p>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-erp-text-primary font-bold text-xl">{progressPct}%</span>
            <span className="text-erp-text-secondary text-xs">সম্পন্ন</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/80">
            <svg viewBox="0 0 100 8" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0" y="0" width={progressPct} height="8" rx="4" ry="4" className="fill-emerald-500" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {progressStats.map((s) => (
              <div key={s.label} className={`rounded-xl p-2 text-center ${s.bgClass}`}>
                <div className={`font-bold text-sm ${s.valueClass}`}>{s.val}</div>
                <div className="text-erp-text-secondary text-[10px] leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DONUT ──────────────────────────────────────── */}
        <div className="bento-area-donut erp-card p-4 flex flex-col items-center justify-center gap-2">
          <p className="text-erp-text-secondary text-xs self-start">মোট: {totalProjects}</p>
          <DonutChart completed={completed} ongoing={ongoing} pending={pending} />
          <div className="flex flex-col gap-1 w-full">
            {[
              { dotClass: "bg-emerald-500", label: "সম্পন্ন", val: completed },
              { dotClass: "bg-sky-400",     label: "চলমান",  val: ongoing },
              { dotClass: "bg-amber-400",   label: "বাকি",   val: pending },
            ].map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d.dotClass}`} />
                  <span className="text-erp-text-secondary text-[10px]">{d.label}</span>
                </div>
                <span className="text-erp-text-primary text-xs font-semibold">{d.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BUDGET (LARGE FINANCE TILE) ────────────────── */}
        <div className="bento-area-budget erp-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-erp-text-secondary text-xs">বাজেট অবস্থা</p>
            <span className="text-erp-text-secondary text-xs">{spentPct}% ব্যয়</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "মোট ফান্ড",  val: totalFunds > 0    ? formatTaka(totalFunds)    : "—", valueClass: "text-slate-200" },
              { label: "খরচ হয়েছে", val: totalExpenses > 0 ? formatTaka(totalExpenses) : "—", valueClass: "text-amber-400" },
              { label: "বাকি আছে",  val: totalFunds > 0    ? formatTaka(remaining)     : "—", valueClass: "text-emerald-500" },
            ].map((b) => (
              <div key={b.label} className="erp-card p-2.5 text-center">
                <div className={`font-bold text-sm mb-0.5 ${b.valueClass}`}>{b.val}</div>
                <div className="text-erp-text-secondary text-[10px] leading-tight">{b.label}</div>
              </div>
            ))}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
            <svg viewBox="0 0 100 10" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width={spentPct} height="10" rx="5" ry="5" fill="url(#budgetGradient)" />
            </svg>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-erp-text-secondary text-xs">{spentPct}% ব্যয়</span>
            <span className="text-erp-text-secondary text-xs">{100 - spentPct}% বাকি</span>
          </div>
        </div>

        {/* ── FINANCE SUMMARY (extra context for accountants / admin) ─── */}
        {(normalizedRole === "admin" || normalizedRole === "manager" || normalizedRole === "accountant") && (
          <div className="bento-area-finance erp-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-erp-accent" />
              <p className="text-erp-text-primary text-sm font-semibold">আর্থিক সারসংক্ষেপ</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="erp-card p-3">
                <div className="text-erp-text-secondary text-xs mb-1">মোট আয়</div>
                <div className="text-emerald-400 font-bold text-base">{totalFunds > 0 ? formatTaka(totalFunds) : "—"}</div>
              </div>
              <div className="erp-card p-3">
                <div className="text-erp-text-secondary text-xs mb-1">মোট ব্যয়</div>
                <div className="text-amber-400 font-bold text-base">{totalExpenses > 0 ? formatTaka(totalExpenses) : "—"}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── QUICK ACTIONS ──────────────────────────────── */}
        <div className="bento-area-qa">
          <p className="text-erp-text-secondary text-xs mb-2">⚡ দৈনিক কাজ</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((a) => (
              <button
                key={a.href}
                type="button"
                onClick={() => router.push(a.href)}
                className="erp-card p-3 flex items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <a.icon className="w-5 h-5 text-erp-accent" />
                </span>
                <div className="min-w-0">
                  <div className="text-erp-text-primary text-xs font-semibold leading-tight truncate">{a.label}</div>
                  <div className="text-erp-text-secondary text-[10px]">{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── CORE ACCESS ────────────────────────────────── */}
        <div className="bento-area-modules">
          <p className="text-erp-text-secondary text-xs mb-2">🧱 Core Access</p>
          <div className="grid grid-cols-4 gap-2">
            {coreModules.map((m) => (
              <button
                key={m.href}
                type="button"
                onClick={() => router.push(m.href)}
                className="erp-card p-3 flex flex-col items-center gap-1.5"
              >
                <m.icon className="w-5 h-5 text-erp-accent" />
                <span className="text-erp-text-secondary text-xs text-center leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>{/* end bento grid */}
    </div>
  );
}
