"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ErpCardProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: "default" | "green" | "amber" | "blue" | "rose";
  className?: string;
};

const ACCENT_BG: Record<NonNullable<ErpCardProps["accent"]>, string> = {
  default: "bg-emerald-500/12",
  green: "bg-emerald-500/12",
  amber: "bg-amber-500/12",
  blue: "bg-sky-500/12",
  rose: "bg-rose-500/12",
};

export function ErpCard({ icon: Icon, label, onClick, accent, className }: ErpCardProps) {
  const accentClass = ACCENT_BG[accent || "default"];
  const interactive = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-label={label}
      className={cn(
        "erp-card flex h-24 w-full flex-col items-center justify-center gap-2 p-3 sm:p-4",
        interactive ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accentClass)}>
        <Icon className="h-5 w-5 text-erp-accent" />
      </span>
      <span className="text-center text-sm font-medium leading-tight text-erp-text-primary">
        {label}
      </span>
    </button>
  );
}
