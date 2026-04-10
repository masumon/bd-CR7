"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ErpCardProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: string;
  className?: string;
};

export function ErpCard({ icon: Icon, label, onClick, accent, className }: ErpCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "erp-card flex h-24 w-full flex-col items-center justify-center gap-2 p-4",
        className
      )}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: accent ?? "rgba(34,197,94,0.12)" }}
      >
        <Icon className="h-5 w-5 text-erp-accent" />
      </span>
      <span className="text-center text-sm font-medium leading-tight text-erp-text-primary">
        {label}
      </span>
    </button>
  );
}
