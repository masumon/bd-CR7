"use client";

/**
 * ModulePageHeader
 * Compact, branded module header — replaces the generic WorkspaceHero.
 * Each module gets a unique color, icon, and stat strip.
 * Total height ~120px vs WorkspaceHero ~200px.
 */

import { type LucideIcon } from "lucide-react";

export interface ModuleStat {
  label: string;      // English
  labelBn: string;    // Bangla
  value: string | number;
  color: "green" | "amber" | "rose" | "blue" | "purple" | "default";
}

interface ModulePageHeaderProps {
  icon: LucideIcon;
  title: string;
  titleBn: string;
  theme: "finance" | "workforce" | "materials" | "evidence" | "audit" | "contractor" | "reports" | "projects" | "settings";
  stats: ModuleStat[];
  actions?: React.ReactNode;
}

const THEME = {
  finance: {
    gradient: "from-yellow-500/12 via-emerald-500/6 to-transparent",
    border: "border-yellow-500/20",
    glow: "bg-yellow-400",
    iconBg: "bg-yellow-500/15",
    iconColor: "text-yellow-400",
    badge: "bg-yellow-500/12 text-yellow-400 border-yellow-500/25",
  },
  workforce: {
    gradient: "from-sky-500/12 via-blue-500/6 to-transparent",
    border: "border-sky-500/20",
    glow: "bg-sky-400",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
    badge: "bg-sky-500/12 text-sky-400 border-sky-500/25",
  },
  materials: {
    gradient: "from-violet-500/12 via-purple-500/6 to-transparent",
    border: "border-violet-500/20",
    glow: "bg-violet-400",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    badge: "bg-violet-500/12 text-violet-400 border-violet-500/25",
  },
  evidence: {
    gradient: "from-amber-500/12 via-orange-500/6 to-transparent",
    border: "border-amber-500/20",
    glow: "bg-amber-400",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/12 text-amber-400 border-amber-500/25",
  },
  audit: {
    gradient: "from-rose-500/12 via-red-500/6 to-transparent",
    border: "border-rose-500/20",
    glow: "bg-rose-400",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    badge: "bg-rose-500/12 text-rose-400 border-rose-500/25",
  },
  contractor: {
    gradient: "from-indigo-500/12 via-blue-500/6 to-transparent",
    border: "border-indigo-500/20",
    glow: "bg-indigo-400",
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-400",
    badge: "bg-indigo-500/12 text-indigo-400 border-indigo-500/25",
  },
  reports: {
    gradient: "from-teal-500/12 via-cyan-500/6 to-transparent",
    border: "border-teal-500/20",
    glow: "bg-teal-400",
    iconBg: "bg-teal-500/15",
    iconColor: "text-teal-400",
    badge: "bg-teal-500/12 text-teal-400 border-teal-500/25",
  },
  projects: {
    gradient: "from-emerald-500/12 via-green-500/6 to-transparent",
    border: "border-emerald-500/20",
    glow: "bg-emerald-400",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    badge: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25",
  },
  settings: {
    gradient: "from-slate-500/12 via-gray-500/6 to-transparent",
    border: "border-slate-500/20",
    glow: "bg-slate-400",
    iconBg: "bg-slate-500/15",
    iconColor: "text-slate-400",
    badge: "bg-slate-500/12 text-slate-400 border-slate-500/25",
  },
};

const STAT_COLOR = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  blue: "text-sky-400",
  purple: "text-violet-400",
  default: "text-foreground",
};

export function ModulePageHeader({ icon: Icon, title, titleBn, theme, stats, actions }: ModulePageHeaderProps) {
  const t = THEME[theme];

  return (
    <div className={`relative mb-3 overflow-hidden rounded-2xl border ${t.border} bg-gradient-to-br ${t.gradient} px-4 py-3`}>
      {/* Decorative glow orb */}
      <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${t.glow} opacity-10 blur-3xl`} />

      {/* Top row: identity + actions */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${t.border} ${t.iconBg}`}>
            <Icon className={`h-6 w-6 ${t.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-foreground leading-tight truncate">{title}</h1>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${t.badge}`}>
                {titleBn}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">BD CR7 ERP Module</p>
          </div>
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        )}
      </div>

      {/* Stats strip */}
      {stats.length > 0 && (
        <div className={`relative mt-3 grid gap-1.5 ${stats.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/6 bg-background/30 px-2.5 py-2 backdrop-blur-sm"
            >
              <p className={`text-sm font-bold leading-tight ${STAT_COLOR[stat.color]}`}>
                {stat.value}
              </p>
              <p className="mt-0.5 truncate text-[9px] leading-tight text-muted-foreground">
                {stat.labelBn}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
