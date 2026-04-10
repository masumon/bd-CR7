"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ShieldCheck, Plus, RefreshCw, Minus, Activity, Clock } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const AuditView = dynamic(
  () => import("./AuditView").then((m) => ({ default: m.AuditView })),
  { ssr: false }
);

interface Stats { total: number; inserts: number; updates: number; deletes: number; today: number; tables: number; }

export function AuditCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ total: 0, inserts: 0, updates: 0, deletes: 0, today: 0, tables: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase.from("audit_logs").select("id,action,table_name,created_at").then(({ data }) => {
      const rows = data ?? [];
      setStats({
        total: rows.length,
        inserts: rows.filter((r) => r.action === "INSERT").length,
        updates: rows.filter((r) => r.action === "UPDATE").length,
        deletes: rows.filter((r) => r.action === "DELETE").length,
        today: rows.filter((r) => (r.created_at || "").slice(0, 10) === today).length,
        tables: new Set(rows.map((r) => r.table_name).filter(Boolean)).size,
      });
    });
  }, [supabase]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={Activity} label="মোট ইভেন্ট" value={stats.total} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Plus} label="INSERT" value={stats.inserts} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={RefreshCw} label="UPDATE" value={stats.updates} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Minus} label="DELETE" value={stats.deletes} accent="rose" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Clock} label="আজকের ইভেন্ট" value={stats.today} accent="blue" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={ShieldCheck} label="টেবিল" value={stats.tables} onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Audit Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Audit / অডিট">
        <AuditView />
      </FullViewDrawer>
    </>
  );
}
