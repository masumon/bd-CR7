"use client";

import { useRouter } from "next/navigation";
import { FolderKanban, HardHat, Building2, ClipboardList } from "lucide-react";

const MODULES = [
  {
    href: "/dashboard/construction/projects",
    icon: FolderKanban,
    label: "Projects / প্রজেক্ট",
    sub: "Manage all projects",
  },
  {
    href: "/dashboard/workforce",
    icon: HardHat,
    label: "Workforce / শ্রমিক",
    sub: "Workers & attendance",
  },
  {
    href: "/dashboard/materials",
    icon: Building2,
    label: "Materials / মালামাল",
    sub: "Inventory & stock",
  },
  {
    href: "/dashboard/evidence",
    icon: ClipboardList,
    label: "Evidence / ডকুমেন্ট",
    sub: "Photos & documents",
  },
];

export function ConstructionView() {
  const router = useRouter();
  return (
    <div className="min-h-dvh flex flex-col gap-3 bg-background p-3 pb-6">
      <div className="erp-card p-4">
        <h1 className="text-erp-text-primary font-semibold text-base">
          Construction / নির্মাণ
        </h1>
        <p className="text-erp-text-secondary text-xs mt-0.5">
          Select a module to continue
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((m) => (
          <button
            key={m.href}
            type="button"
            onClick={() => router.push(m.href)}
            className="erp-card p-4 flex flex-col items-start gap-2 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <m.icon className="w-5 h-5 text-erp-accent" />
            </span>
            <div>
              <div className="text-erp-text-primary text-sm font-semibold leading-snug">
                {m.label}
              </div>
              <div className="text-erp-text-secondary text-xs mt-0.5">{m.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
