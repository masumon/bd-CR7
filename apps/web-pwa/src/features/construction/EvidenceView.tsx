"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, FileText, MapPin, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
import { ProgressCamFeature } from "@/features/construction/progress_cam/ProgressCamFeature";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("progress_cam")
      .select("id,phase,caption,file_url,file_type,latitude,longitude,created_at")
      .order("created_at", { ascending: false })
      .limit(40);
    setRecords((data as EvidenceRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const stats = useMemo(() => {
    const images = records.filter((r) => !r.file_type?.startsWith("video")).length;
    const videos = records.filter((r) => r.file_type?.startsWith("video")).length;
    const geoTagged = records.filter((r) => r.latitude != null).length;
    return { images, videos, geoTagged, total: records.length };
  }, [records]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("progress_cam").delete().eq("id", deleteTarget);
    setDeleteTarget(null);
    await loadRecords();
  };

  const tabs = ["Upload", "Gallery", "GPS Map"];

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Evidence"
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
                  <div
                    key={r.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {r.file_type?.startsWith("video") ? (
                        <div className="flex aspect-square items-center justify-center bg-muted">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
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
                    <button
                      onClick={() => setDeleteTarget(r.id)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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

      {deleteTarget && (
        <Dialog open title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this evidence file? This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button onClick={handleDelete}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
