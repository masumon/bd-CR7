"use client";

/**
 * CompactStatCard — Tiny stat tile for no-scroll dashboard grid.
 * Fits perfectly in a 2-col mobile grid.
 */

import { type LucideIcon } from "lucide-react";

interface CompactStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "amber" | "rose" | "blue" | "default";
  onClick?: () => void;
}

const ACCENT_MAP = {
  green: "text-emerald-400 bg-emerald-500/12",
  amber: "text-amber-400 bg-amber-500/12",
  rose: "text-rose-400 bg-rose-500/12",
  blue: "text-sky-400 bg-sky-500/12",
  default: "text-primary bg-primary/12",
};

export function CompactStatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "default",
  onClick,
}: CompactStatCardProps) {
  const colors = ACCENT_MAP[accent];
  const interactive = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-label={`${label}: ${value}`}
      className={`flex h-full w-full flex-col justify-between rounded-xl border border-border/40 bg-card/70 p-2.5 text-left backdrop-blur-sm transition-all active:scale-[0.97] ${
        interactive ? "hover:border-primary/40 cursor-pointer" : "cursor-default"
      }`}
    >
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-1.5 min-w-0">
        <p className="truncate text-[11px] font-bold leading-tight text-foreground">{value}</p>
        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 truncate text-[9px] text-muted-foreground/60">{sub}</p>}
      </div>
    </button>
  );
}
