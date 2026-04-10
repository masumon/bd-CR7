"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FolderKanban, CheckCircle2, Clock, PauseCircle, XCircle, BarChart2 } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const ProjectsFeature = dynamic(
  () => import("./ProjectsFeature").then((m) => ({ default: m.ProjectsFeature })),
  { ssr: false }
);

interface Stats { total: number; active: number; completed: number; paused: number; cancelled: number; planning: number; }

export function ProjectsCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, paused: 0, cancelled: 0, planning: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("projects").select("id,status");
    const rows = data ?? [];
    setStats({
      total: rows.length,
      active: rows.filter((r) => r.status === "Active").length,
      completed: rows.filter((r) => r.status === "Completed").length,
      paused: rows.filter((r) => r.status === "Paused").length,
      cancelled: rows.filter((r) => r.status === "Cancelled").length,
      planning: rows.filter((r) => r.status === "Planning").length,
    });
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={FolderKanban} label="মোট প্রজেক্ট" value={stats.total} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={BarChart2} label="চলমান" value={stats.active} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={CheckCircle2} label="সম্পন্ন" value={stats.completed} accent="blue" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Clock} label="পরিকল্পনায়" value={stats.planning} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={PauseCircle} label="বিরতিতে" value={stats.paused} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={XCircle} label="বাতিল" value={stats.cancelled} accent="rose" onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <FolderKanban className="h-3.5 w-3.5" />
        Projects Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Projects / প্রজেক্ট">
        <ProjectsFeature />
      </FullViewDrawer>
    </>
  );
}
