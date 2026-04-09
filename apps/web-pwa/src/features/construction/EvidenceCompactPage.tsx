"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, FileText, Film, MapPin, FolderOpen, Clock } from "lucide-react";

import { CompactStatCard } from "@/components/ui/CompactStatCard";
import { FullViewDrawer } from "@/components/ui/FullViewDrawer";
import { createClient } from "@/lib/supabase/client";

const EvidenceView = dynamic(
  () => import("./EvidenceView").then((m) => ({ default: m.EvidenceView })),
  { ssr: false }
);

interface Stats {
  total: number;
  photos: number;
  videos: number;
  docs: number;
  geoTagged: number;
  today: number;
}

export function EvidenceCompactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats>({ total: 0, photos: 0, videos: 0, docs: 0, geoTagged: 0, today: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("evidence_files")
      .select("id,file_type,latitude,created_at");
    const rows = data ?? [];
    setStats({
      total: rows.length,
      photos: rows.filter((r) => r.file_type?.startsWith("image")).length,
      videos: rows.filter((r) => r.file_type?.startsWith("video")).length,
      docs: rows.filter((r) => !r.file_type?.startsWith("image") && !r.file_type?.startsWith("video")).length,
      geoTagged: rows.filter((r) => r.latitude).length,
      today: rows.filter((r) => (r.created_at || "").slice(0, 10) === today).length,
    });
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-2 p-1">
        <CompactStatCard icon={FolderOpen} label="মোট ফাইল" value={stats.total} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Camera} label="ছবি" value={stats.photos} accent="blue" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Film} label="ভিডিও" value={stats.videos} accent="amber" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={FileText} label="ডকুমেন্ট" value={stats.docs} onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={MapPin} label="জিও-ট্যাগড" value={stats.geoTagged} accent="green" onClick={() => setDrawerOpen(true)} />
        <CompactStatCard icon={Clock} label="আজকের আপলোড" value={stats.today} accent="default" onClick={() => setDrawerOpen(true)} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-float hover:opacity-90 transition-opacity"
      >
        <Camera className="h-3.5 w-3.5" />
        Evidence Full View
      </button>

      <FullViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Evidence / ডকুমেন্ট">
        <EvidenceView />
      </FullViewDrawer>
    </>
  );
}
