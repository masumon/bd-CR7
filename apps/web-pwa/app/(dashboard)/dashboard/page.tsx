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
        style={{ transform: `rotate(${base}deg)`, transformOrigin: "50% 50%", transition: "stroke-dasharray 0.4s" }}
      />
      {/* Ongoing – blue */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#60A5FA" strokeWidth={sw}
        strokeDasharray={`${arc(oPct)} ${circ - arc(oPct)}`}
        strokeLinecap="butt"
        style={{ transform: `rotate(${base + cPct * 360}deg)`, transformOrigin: "50% 50%", transition: "stroke-dasharray 0.4s" }}
      />
      {/* Pending – amber */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#FBBF24" strokeWidth={sw}
        strokeDasharray={`${arc(1 - cPct - oPct)} ${circ - arc(1 - cPct - oPct)}`}
        strokeLinecap="butt"
        style={{ transform: `rotate(${base + (cPct + oPct) * 360}deg)`, transformOrigin: "50% 50%", transition: "stroke-dasharray 0.4s" }}
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

  const coreModules = [
    { icon: Package, label: "মালামাল", href: "/dashboard/materials" },
    { icon: Users, label: "শ্রমিক", href: "/dashboard/workforce" },
    { icon: DollarSign, label: "খরচ", href: "/dashboard/finance" },
    { icon: BarChart2, label: "অগ্রগতি", href: "/dashboard/construction" },
  ];

  const displayName = (role && ROLE_DISPLAY[role.toLowerCase()]) ?? role ?? "ম্যানেজার";

  return (
    <div
      className="min-h-dvh flex flex-col gap-3 p-3 overflow-x-hidden pb-6"
      style={{ background: "#0B1A13" }}
    >
      {/* ── 1. HEADER ─────────────────────────────────────────────────────── */}
      <div className="erp-card p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-erp-text-primary font-semibold text-base leading-snug truncate">
            স্বাগতম, {displayName} 👋
          </h1>
          <p className="text-erp-text-secondary text-xs mt-0.5">Project: {project.name}</p>
        </div>
        <span
          className="flex-shrink-0 flex items-center gap-1.5 text-erp-accent text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.12)" }}
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
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full bg-erp-accent"
                style={{ width: `${project.progress}%`, transition: "width 0.5s ease" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { val: project.completed, label: "সম্পন্ন", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
                { val: project.ongoing, label: "চলমান", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
                { val: project.pending, label: "বাকি", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: s.bg }}>
                  <div className="font-bold text-sm" style={{ color: s.color }}>{s.val}</div>
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
          {[
            { label: "মোট বাজেট", val: formatTaka(project.totalBudget), color: "#E5E7EB" },
            { label: "খরচ হয়েছে", val: formatTaka(project.spent), color: "#FBBF24" },
            { label: "বাকি আছে", val: formatTaka(remaining), color: "#22C55E" },
          ].map((b) => (
            <div key={b.label}>
              <div className="text-erp-text-secondary text-xs mb-0.5">{b.label}</div>
              <div className="font-semibold text-sm" style={{ color: b.color }}>{b.val}</div>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${spentPct}%`,
              background: "linear-gradient(90deg, #FBBF24, #22C55E)",
              transition: "width 0.5s ease",
            }}
          />
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
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.12)" }}
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
