"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { HardHat, Users, CheckCircle2, XCircle, Wallet, TrendingDown, LayoutList } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const WorkforceView = dynamic(
  () => import("./WorkforceView").then((m) => ({ default: m.WorkforceView })),
  { ssr: false }
);

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

interface Stats {
  total: number;
  present: number;
  absent: number;
  totalWages: number;
  paid: number;
  unpaid: number;
}

export function WorkforceCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ total: 0, present: 0, absent: 0, totalWages: 0, paid: 0, unpaid: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("worker_logs")
      .select("id,attendance_status,daily_wage,paid_amount,unpaid_balance");
    const rows = data ?? [];
    setStats({
      total: rows.length,
      present: rows.filter((r) => r.attendance_status === "Present").length,
      absent: rows.filter((r) => r.attendance_status === "Absent").length,
      totalWages: rows.reduce((s, r) => s + Number(r.daily_wage || 0), 0),
      paid: rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0),
      unpaid: rows.reduce((s, r) => s + Number(r.unpaid_balance || 0), 0),
    });
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={Users} label="মোট শ্রমিক" value={stats.total} accent="default" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={CheckCircle2} label="উপস্থিত" value={stats.present} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={XCircle} label="অনুপস্থিত" value={stats.absent} accent="rose" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Wallet} label="মোট মজুরি" value={fmt(stats.totalWages)} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={CheckCircle2} label="পরিশোধিত" value={fmt(stats.paid)} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={TrendingDown} label="বকেয়া" value={fmt(stats.unpaid)} accent="rose" onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <HardHat className="h-3.5 w-3.5" />
        Workforce Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Workforce / শ্রমিক">
        <WorkforceView />
      </FullViewDrawer>
    </>
  );
}
