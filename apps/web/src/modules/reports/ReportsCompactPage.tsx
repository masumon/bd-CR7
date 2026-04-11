"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, DollarSign, TrendingDown, TrendingUp, Users, Package } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const ReportsFeature = dynamic(
  () => import("./ReportsFeature").then((m) => ({ default: m.ReportsFeature })),
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
  approved: number;
  workers: number;
  materials: number;
}

export function ReportsCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ totalFunds: 0, totalExpenses: 0, pending: 0, approved: 0, workers: 0, materials: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchNumericSum = useCallback(async (table: string, column: string) => {
    const { data, error } = await supabase.from(table).select(column);
    if (error || !data) return null;
    const rows = data as unknown as Array<Record<string, unknown>>;
    return rows.reduce((sum, row) => sum + Number(row[column] || 0), 0);
  }, [supabase]);

  const fetchRowCount = useCallback(async (table: string) => {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  }, [supabase]);

  const load = useCallback(async () => {
    const [fundsPrimary, fundsFallback, expensesRes, workersPrimary, workersFallback, materialsPrimary, materialsFallback] = await Promise.all([
      fetchNumericSum("fund_transactions", "amount"),
      fetchNumericSum("funds", "amount"),
      supabase.from("expenses").select("amount,status"),
      fetchRowCount("attendance"),
      fetchRowCount("worker_logs"),
      fetchRowCount("material_movements"),
      fetchRowCount("material_logs"),
    ]);

    const funds = fundsPrimary ?? fundsFallback ?? 0;
    const expRows = expensesRes.data ?? [];
    const expenses = expRows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const pending = expRows.filter((r) => String(r.status).toLowerCase() === "pending").length;
    const approved = expRows.filter((r) => String(r.status).toLowerCase() === "approved").length;

    setStats({
      totalFunds: funds,
      totalExpenses: expenses,
      pending,
      approved,
      workers: workersPrimary ?? workersFallback ?? 0,
      materials: materialsPrimary ?? materialsFallback ?? 0,
    });
  }, [fetchNumericSum, fetchRowCount, supabase]);

  useEffect(() => { void load(); }, [load]);

  const net = stats.totalFunds - stats.totalExpenses;

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={DollarSign} label="মোট ফান্ড" value={fmt(stats.totalFunds)} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={TrendingDown} label="মোট ব্যয়" value={fmt(stats.totalExpenses)} accent="rose" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={TrendingUp} label="নেট ব্যালেন্স" value={fmt(net)} accent={net >= 0 ? "green" : "rose"} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={BarChart3} label="অনুমোদিত" value={stats.approved} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Users} label="শ্রমিক লগ" value={stats.workers} accent="blue" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Package} label="মালামাল" value={stats.materials} accent="amber" onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Reports Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Reports / রিপোর্ট">
        <ReportsFeature />
      </FullViewDrawer>
    </>
  );
}
