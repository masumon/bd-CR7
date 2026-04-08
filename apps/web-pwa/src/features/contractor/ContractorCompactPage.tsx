"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Briefcase, CheckCircle2, XCircle, Clock, CalendarDays, Building2 } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const ContractorView = dynamic(
  () => import("./ContractorView").then((m) => ({ default: m.ContractorView })),
  { ssr: false }
);

interface Stats { total: number; active: number; inactive: number; thisMonth: number; companies: number; specializations: number; }

export function ContractorCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, thisMonth: 0, companies: 0, specializations: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const month = new Date().toISOString().slice(0, 7);
    const { data } = await supabase.from("contractors").select("id,status,company,specialization,created_at");
    const rows = data ?? [];
    setStats({
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      inactive: rows.filter((r) => r.status !== "active").length,
      thisMonth: rows.filter((r) => (r.created_at || "").slice(0, 7) === month).length,
      companies: new Set(rows.map((r) => r.company).filter(Boolean)).size,
      specializations: new Set(rows.map((r) => r.specialization).filter(Boolean)).size,
    });
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={Briefcase} label="মোট ঠিকাদার" value={stats.total} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={CheckCircle2} label="সক্রিয়" value={stats.active} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={XCircle} label="নিষ্ক্রিয়" value={stats.inactive} accent="rose" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={CalendarDays} label="এই মাসে নতুন" value={stats.thisMonth} accent="blue" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Building2} label="কোম্পানি" value={stats.companies} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Clock} label="বিশেষত্ব" value={stats.specializations} onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <Briefcase className="h-3.5 w-3.5" />
        Contractor Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Contractor / ঠিকাদার">
        <ContractorView />
      </FullViewDrawer>
    </>
  );
}
