"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  FolderKanban,
  Home,
  Import,
  Settings2,
  ShoppingCart,
  Users,
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
      { href: "/dashboard", label: lang === "bn" ? "হোম" : "Home", icon: Home },
      { href: "/dashboard/construction/projects", label: lang === "bn" ? "প্রজেক্ট" : "Projects", icon: FolderKanban },
      { href: "/dashboard/finance", label: lang === "bn" ? "ফাইন্যান্স" : "Finance", icon: BarChart3 },
      { href: "/dashboard/import", label: lang === "bn" ? "ইমপোর্ট" : "Import", icon: Import },
      { href: "/dashboard/pos", label: "POS", icon: ShoppingCart },
      { href: "/dashboard/reports", label: lang === "bn" ? "রিপোর্ট" : "Reports", icon: Users },
      { href: "/dashboard/ai", label: "AI", icon: Bot },
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
