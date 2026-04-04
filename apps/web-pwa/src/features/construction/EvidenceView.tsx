"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, FileText, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
import { ProgressCamFeature } from "@/features/construction/progress_cam/ProgressCamFeature";
import { createClient } from "@/lib/supabase/client";

type EvidenceRow = {
  id: string;
  phase: string;
  caption: string | null;
  file_url: string;
  file_type: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export function EvidenceView() {
  const supabase = useMemo(() => createClient(), []);
  const [records, setRecords] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Upload");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("progress_cam")
        .select("id,phase,caption,file_url,file_type,latitude,longitude,created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      setRecords((data as EvidenceRow[]) || []);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const stats = useMemo(() => {
    const images = records.filter((r) => !r.file_type?.startsWith("video")).length;
    const videos = records.filter((r) => r.file_type?.startsWith("video")).length;
    const geoTagged = records.filter((r) => r.latitude != null).length;
    return { images, videos, geoTagged, total: records.length };
  }, [records]);

  const tabs = ["Upload", "Gallery", "GPS Map"];

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Evidence"
        title="Site Evidence & Documents"
        description="Upload photos, videos, and GPS-tagged construction progress"
        stats={[
          { label: "Total Files", value: String(stats.total) },
          { label: "Images", value: String(stats.images) },
          { label: "GPS Tagged", value: String(stats.geoTagged) },
        ]}
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === "Upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-primary" />
              Upload Evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressCamFeature />
          </CardContent>
        </Card>
      )}

      {activeTab === "Gallery" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Evidence Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : records.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No evidence files yet. Upload above.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {records.map((r) => (
                  <a
                    key={r.id}
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    {r.file_type?.startsWith("video") ? (
                      <div className="flex aspect-square items-center justify-center bg-muted">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={r.file_url}
                        alt={r.caption || r.phase}
                        className="aspect-square w-full object-cover transition group-hover:opacity-90"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-2 py-1.5">
                      <p className="truncate text-[10px] font-medium text-white">{r.phase}</p>
                      {r.latitude != null && (
                        <p className="flex items-center gap-0.5 text-[9px] text-white/70">
                          <MapPin className="h-2.5 w-2.5" /> GPS
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "GPS Map" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              GPS Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                {records
                  .filter((r) => r.latitude != null)
                  .map((r) => (
                    <a
                      key={r.id}
                      href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition hover:bg-muted"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{r.phase}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </a>
                  ))}
                {records.filter((r) => r.latitude != null).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No GPS-tagged evidence found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
