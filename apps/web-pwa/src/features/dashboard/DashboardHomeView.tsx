"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  Building2,
  ClipboardList,
  FolderKanban,
  HardHat,
  Home,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { ActivityList } from "@/components/dashboard/ActivityList";
import { KPISection } from "@/components/dashboard/KPISection";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { useDashboardStats } from "@/hooks/useDashboardStats";

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

export function DashboardHomeView() {
  const s = useDashboardStats();
  const [lang, setLang] = useState<"en" | "bn">("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("bdcr7-language") : null;
    if (stored === "bn" || stored === "en") {
      setLang(stored);
      return;
    }
    if (typeof document !== "undefined") {
      setLang(document.documentElement.lang === "bn" ? "bn" : "en");
    }
  }, []);

  const modules = useMemo(
    () => [
      { href: "/dashboard", label: lang === "bn" ? "ড্যাশবোর্ড" : "Dashboard", icon: Home },
      { href: "/dashboard/construction/projects", label: lang === "bn" ? "প্রজেক্ট" : "Projects", icon: FolderKanban },
      { href: "/dashboard/finance", label: lang === "bn" ? "ফাইন্যান্স" : "Finance", icon: BarChart3 },
      { href: "/dashboard/workforce", label: lang === "bn" ? "শ্রমিক" : "Workforce", icon: HardHat },
      { href: "/dashboard/materials", label: lang === "bn" ? "মালামাল" : "Materials", icon: Building2 },
      { href: "/dashboard/evidence", label: lang === "bn" ? "ডকুমেন্ট" : "Evidence", icon: ClipboardList },
      { href: "/dashboard/reports", label: lang === "bn" ? "রিপোর্ট" : "Reports", icon: BarChart3 },
      { href: "/dashboard/ai", label: "SUMONIX AI", icon: Bot },
      { href: "/dashboard/audit", label: lang === "bn" ? "অডিট" : "Audit", icon: ShieldCheck },
      { href: "/dashboard/settings", label: lang === "bn" ? "সেটিংস" : "Settings", icon: Settings2 },
    ],
    [lang]
  );

  return (
    <div className="space-y-3">
      <KPISection
        funds={s.loading ? "..." : fmt(s.totalFundsReceived)}
        balance={s.loading ? "..." : fmt(s.currentBalance)}
        expenses={s.loading ? "..." : fmt(s.totalExpenses)}
        workers={s.loading ? "..." : String(s.totalWorkers)}
      />

      <ModuleGrid items={modules} />

      <ActivityList items={s.recentActivity} />
    </div>
  );
}
