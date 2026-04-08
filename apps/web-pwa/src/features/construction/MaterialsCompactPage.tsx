"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, DollarSign, LayoutList } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const MaterialsView = dynamic(
  () => import("./MaterialsView").then((m) => ({ default: m.MaterialsView })),
  { ssr: false }
);

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

interface Stats {
  total: number;
  stockIn: number;
  stockOut: number;
  lowStock: number;
  totalCost: number;
  items: number;
}

export function MaterialsCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ total: 0, stockIn: 0, stockOut: 0, lowStock: 0, totalCost: 0, items: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("material_logs")
      .select("id,quantity,movement_type,cost_per_unit,low_stock_threshold");
    const rows = data ?? [];
    const stockIn = rows.filter((r) => r.movement_type === "in").reduce((s, r) => s + Number(r.quantity || 0), 0);
    const stockOut = rows.filter((r) => r.movement_type === "out").reduce((s, r) => s + Number(r.quantity || 0), 0);
    const totalCost = rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.cost_per_unit || 0), 0);
    const lowStock = rows.filter((r) => r.low_stock_threshold && Number(r.quantity) < Number(r.low_stock_threshold)).length;
    const items = new Set(rows.map((r: { id: string }) => r.id)).size;

    setStats({ total: rows.length, stockIn, stockOut, lowStock, totalCost, items });
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={LayoutList} label="মোট রেকর্ড" value={stats.total} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={ArrowDownToLine} label="স্টক ইন" value={stats.stockIn} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={ArrowUpFromLine} label="স্টক আউট" value={stats.stockOut} accent="rose" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={AlertTriangle} label="কম স্টক" value={stats.lowStock} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={DollarSign} label="মোট মূল্য" value={fmt(stats.totalCost)} accent="blue" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Package} label="আইটেম" value={stats.items} onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <Package className="h-3.5 w-3.5" />
        Materials Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Materials / মালামাল">
        <MaterialsView />
      </FullViewDrawer>
    </>
  );
}
