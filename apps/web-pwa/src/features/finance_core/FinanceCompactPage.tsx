"use client";

/**
 * FinanceCompactPage — No-scroll compact overview for Finance module.
 * Stats loaded via lightweight queries. Full view opens in FullViewDrawer.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BadgeDollarSign,
  CheckCircle2,
  Clock,
  FileWarning,
  Landmark,
  LayoutList,
  Plus,
  TrendingDown,
} from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

// Lazy-load the heavy locked View — only fetched when drawer opens
const FinanceExpenseView = dynamic(
  () => import("./FinanceExpenseView").then((m) => ({ default: m.FinanceExpenseView })),
  { ssr: false }
);

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

interface Stats {
  totalFunds: number;
  totalExpenses: number;
  pending: number;
  approvedToday: number;
  receiptsMissing: number;
  records: number;
}

export function FinanceCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({
    totalFunds: 0, totalExpenses: 0, pending: 0,
    approvedToday: 0, receiptsMissing: 0, records: 0,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [fundsRes, expensesRes] = await Promise.all([
      supabase.from("funds").select("amount"),
      supabase.from("expenses").select("id,amount,status,receipt_url,created_at"),
    ]);

    const funds = (fundsRes.data ?? []).reduce((s, r) => s + Number(r.amount || 0), 0);
    const rows = expensesRes.data ?? [];
    const expenses = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const pending = rows.filter((r) => String(r.status).toLowerCase() === "pending").length;
    const approvedToday = rows
      .filter((r) => String(r.status).toLowerCase() === "approved" && (r.created_at || "").slice(0, 10) === today)
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const receiptsMissing = rows.filter((r) => !r.receipt_url).length;

    setStats({ totalFunds: funds, totalExpenses: expenses, pending, approvedToday, receiptsMissing, records: rows.length });
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard
          icon={Landmark}
          label="মোট ফান্ড"
          value={fmt(stats.totalFunds)}
          accent="green"
          onClick={() => setDrawerOpen(true)}
        />
        <CompactStatCard
          icon={TrendingDown}
          label="মোট ব্যয়"
          value={fmt(stats.totalExpenses)}
          accent="amber"
          onClick={() => setDrawerOpen(true)}
        />
        <CompactStatCard
          icon={Clock}
          label="অনুমোদন বাকি"
          value={stats.pending}
          accent="rose"
          onClick={() => setDrawerOpen(true)}
        />
        <CompactStatCard
          icon={CheckCircle2}
          label="আজ অনুমোদিত"
          value={fmt(stats.approvedToday)}
          accent="green"
          onClick={() => setDrawerOpen(true)}
        />
        <CompactStatCard
          icon={FileWarning}
          label="রসিদ নেই"
          value={stats.receiptsMissing}
          accent="rose"
          onClick={() => setDrawerOpen(true)}
        />
        <CompactStatCard
          icon={LayoutList}
          label="মোট রেকর্ড"
          value={stats.records}
          onClick={() => setDrawerOpen(true)}
        />
      </div>

      {/* Floating action */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <BadgeDollarSign className="h-3.5 w-3.5" />
        Finance Full View
      </button>

      <FullViewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Finance / তহবিল ও খরচ"
      >
        <FinanceExpenseView />
      </FullViewDrawer>
    </>
  );
}
