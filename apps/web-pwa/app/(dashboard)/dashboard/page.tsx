"use client";

import { useRouter } from "next/navigation";
import {
  DollarSign, Users, Package, BarChart2, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

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
  // SVG circles start at 3 o'clock; rotate -90° so 0% begins at 12 o'clock
  const base = -90;

  const arc = (pct: number) => pct * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
      {/* Completed – green */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#22C55E" strokeWidth={sw}
        strokeDasharray={`${arc(cPct)} ${circ - arc(cPct)}`}
        strokeLinecap="butt"
        transform={`rotate(${base} ${size / 2} ${size / 2})`}
      />
      {/* Ongoing – blue */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#60A5FA" strokeWidth={sw}
        strokeDasharray={`${arc(oPct)} ${circ - arc(oPct)}`}
        strokeLinecap="butt"
        transform={`rotate(${base + cPct * 360} ${size / 2} ${size / 2})`}
      />
      {/* Pending – amber */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#FBBF24" strokeWidth={sw}
        strokeDasharray={`${arc(pPct)} ${circ - arc(pPct)}`}
        strokeLinecap="butt"
        transform={`rotate(${base + (cPct + oPct) * 360} ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill="#E5E7EB" fontSize="15" fontWeight="700"
      >
        {Math.round(cPct * 100)}%
      </text>
    </svg>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
/** Map internal role IDs to friendly Bangla display names */
const ROLE_DISPLAY: Record<string, string> = {
  admin: "অ্যাডমিন",
  manager: "ম্যানেজার",
  supervisor: "সুপারভাইজার",
  worker: "কর্মী",
  accountant: "হিসাবরক্ষক",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTaka(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n}`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();

  // Static project data – replace with real store/API when available
  const project = {
    name: "BD CR7",
    stage: "Structure",
    progress: 65,
    completed: 13,
    ongoing: 5,
    pending: 7,
    totalBudget: 1000000,
    spent: 650000,
  };

  const remaining = project.totalBudget - project.spent;
  const spentPct = Math.round((project.spent / project.totalBudget) * 100);

  const quickActions = [
    { icon: Package, label: "Material যোগ", sub: "Add Material", href: "/dashboard/materials" },
    { icon: Users, label: "Worker যোগ", sub: "Add Worker", href: "/dashboard/workforce" },
    { icon: DollarSign, label: "খরচ যোগ", sub: "Add Expense", href: "/dashboard/finance" },
    { icon: TrendingUp, label: "Progress আপডেট", sub: "Update", href: "/dashboard/construction" },
  ];

  const progressStats = [
    { val: project.completed, label: "সম্পন্ন", valueClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { val: project.ongoing, label: "চলমান", valueClass: "text-sky-400", bgClass: "bg-sky-400/10" },
    { val: project.pending, label: "বাকি", valueClass: "text-amber-400", bgClass: "bg-amber-400/10" },
  ];

  const budgetStats = [
    { label: "মোট বাজেট", val: formatTaka(project.totalBudget), valueClass: "text-slate-200" },
    { label: "খরচ হয়েছে", val: formatTaka(project.spent), valueClass: "text-amber-400" },
    { label: "বাকি আছে", val: formatTaka(remaining), valueClass: "text-emerald-500" },
  ];

  const coreModules = [
    { icon: Package, label: "মালামাল", href: "/dashboard/materials" },
    { icon: Users, label: "শ্রমিক", href: "/dashboard/workforce" },
    { icon: DollarSign, label: "খরচ", href: "/dashboard/finance" },
    { icon: BarChart2, label: "অগ্রগতি", href: "/dashboard/construction" },
  ];

  const displayName = (role && ROLE_DISPLAY[role.toLowerCase()]) ?? role ?? "ম্যানেজার";

  return (
    <div className="min-h-dvh flex flex-col gap-3 overflow-x-hidden bg-background p-3 pb-6">
      {/* ── 1. HEADER ─────────────────────────────────────────────────────── */}
      <div className="erp-card p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-erp-text-primary font-semibold text-base leading-snug truncate">
            স্বাগতম, {displayName} 👋
          </h1>
          <p className="text-erp-text-secondary text-xs mt-0.5">Project: {project.name}</p>
        </div>
        <span
          className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-erp-accent"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-erp-accent" />
          চলমান
        </span>
      </div>

      {/* ── 2+3. PROGRESS + DONUT ─────────────────────────────────────────── */}
      <div className="erp-card p-4">
        <p className="text-erp-text-secondary text-xs mb-3">
          কাজের অগ্রগতি (Progress) &nbsp;·&nbsp; Stage: {project.stage}
        </p>
        <div className="flex items-start gap-4">
          {/* Left: bar + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-erp-text-primary font-bold text-lg">{project.progress}%</span>
              <span className="text-erp-text-secondary text-xs">সম্পন্ন</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <svg viewBox="0 0 100 8" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                <rect x="0" y="0" width={project.progress} height="8" rx="4" ry="4" className="fill-emerald-500" />
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {progressStats.map((s) => (
                <div key={s.label} className={`rounded-xl p-2 text-center ${s.bgClass}`}>
                  <div className={`font-bold text-sm ${s.valueClass}`}>{s.val}</div>
                  <div className="text-erp-text-secondary text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: donut */}
          <DonutChart completed={project.completed} ongoing={project.ongoing} pending={project.pending} />
        </div>
      </div>

      {/* ── 4. BUDGET ─────────────────────────────────────────────────────── */}
      <div className="erp-card p-4">
        <p className="text-erp-text-secondary text-xs mb-3">বাজেট অবস্থা (Budget)</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {budgetStats.map((b) => (
            <div key={b.label}>
              <div className="text-erp-text-secondary text-xs mb-0.5">{b.label}</div>
              <div className={`font-semibold text-sm ${b.valueClass}`}>{b.val}</div>
            </div>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 8" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={spentPct} height="8" rx="4" ry="4" fill="url(#budgetGradient)" />
          </svg>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-erp-text-secondary text-xs">{spentPct}% ব্যয়</span>
          <span className="text-erp-text-secondary text-xs">{100 - spentPct}% বাকি</span>
        </div>
      </div>

      {/* ── 5. QUICK ACTIONS ─────────────────────────────────────────────── */}
      <div>
        <p className="text-erp-text-secondary text-xs mb-2">⚡ দৈনিক কাজ (Quick Actions)</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.href}
              type="button"
              onClick={() => router.push(a.href)}
              className="erp-card p-3 flex items-center gap-3 text-left"
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15"
              >
                <a.icon className="w-5 h-5 text-erp-accent" />
              </span>
              <div className="min-w-0">
                <div className="text-erp-text-primary text-xs font-semibold leading-tight truncate">{a.label}</div>
                <div className="text-erp-text-secondary text-xs">{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 6. CORE ACCESS ───────────────────────────────────────────────── */}
      <div>
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

      {/* ── FLOATING AI: handled globally by MobileAppShell ─────────────── */}
    </div>
  );
}
