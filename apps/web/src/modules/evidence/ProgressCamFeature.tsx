"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { detectFileType } from "@/components/ui/FilePreviewInline";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { PermissionGate } from "@/components/ui/PermissionGate";

const PHASES = ["Foundation", "Structure", "Finishing", "Handover"];

type ProgressEntry = {
  media_url: string;
  phase_category: string;
  caption: string;
  created_at?: string;
};

export function ProgressCamFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phaseCategory, setPhaseCategory] = useState(PHASES[0]);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const {
    files,
    error: filesError,
    insertFile,
  } = useProjectFiles({
    module: "evidence",
    category: "progress",
    limit: 20,
  });

  const entries = useMemo<ProgressEntry[]>(
    () =>
      files.map((row) => ({
        media_url: row.file_url,
        phase_category: row.subcategory || "Uncategorized",
        caption: row.description || "",
        created_at: row.created_at,
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isVideo = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes(".mp4") || lower.includes(".mov") || lower.includes(".webm") || lower.includes("/video/");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setMessage("Photo/Video file is required");
      return;
    }

    setUploading(true);
    try {
      const mediaUrl = await uploadToCloudinary(file);

      await insertFile({
        module: "evidence",
        category: "progress",
        subcategory: phaseCategory,
        file_type: detectFileType(file.name),
        file_url: mediaUrl,
        file_name: file.name,
        description: caption.trim() || null,
        file_size_bytes: file.size,
      });

      setMessage("Progress media uploaded");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setFile(null);
      setCaption("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  /** File input shared between upload and camera fallback */
  const fileInput = (
    <input
      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
      type="file"
      title="Photo or video upload"
      accept="image/*,video/*"
      onChange={(e) => {
        const next = e.target.files?.[0] || null;
        setFile(next);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(next ? URL.createObjectURL(next) : null);
      }}
    />
  );

  return (
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">Progress Visualizer</h3>
        <p className="mt-1 text-sm text-muted-foreground">Upload image or video evidence by phase category with a clearer visual log.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          {/* Camera capture — wrapped in PermissionGate; file upload shown as fallback */}
          <PermissionGate type="camera" fallback={fileInput}>
            <div className="flex flex-col gap-2">
              <input
                id="progress-cam-capture"
                className="hidden"
                type="file"
                title="Capture from camera"
                accept="image/*,video/*"
                capture="environment"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null;
                  setFile(next);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(next ? URL.createObjectURL(next) : null);
                }}
              />
              <label
                htmlFor="progress-cam-capture"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                📷 Capture from Camera / ক্যামেরা থেকে ছবি তুলুন
              </label>
              {fileInput}
            </div>
          </PermissionGate>
        </div>
        <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Phase category" value={phaseCategory} onChange={(e) => setPhaseCategory(e.target.value)}>
          {PHASES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" rows={2} />
        {previewUrl ? (
          <div className="rounded-2xl border border-border/70 bg-background/75 p-3 md:col-span-2">
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Preview</p>
            {file && file.type.startsWith("video/") ? (
              <video className="h-48 w-full rounded-xl object-cover" controls src={previewUrl} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Selected progress preview" className="h-48 w-full rounded-xl object-cover" />
            )}
          </div>
        ) : null}
        <button
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          type="submit"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload Progress Media"}
        </button>
      </form>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {entries.slice(0, 8).map((entry, idx) => (
          <div key={`${entry.media_url}-${idx}`} className="rounded-xl border border-border/70 bg-background/75 px-3 py-3">
            <p className="font-medium text-foreground">{entry.phase_category}</p>
            <p className="mt-1">{entry.caption || "No caption provided"}</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border/60 bg-background/90">
              {isVideo(entry.media_url) ? (
                <video className="h-44 w-full object-cover" controls src={entry.media_url} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.media_url} alt={entry.caption || entry.phase_category} className="h-44 w-full object-cover" />
              )}
            </div>
            {entry.created_at ? <p className="mt-2 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p> : null}
            <p className="mt-1 truncate text-xs text-muted-foreground">{entry.media_url}</p>
          </div>
        ))}
      </div>
      {filesError ? <p className="mt-3 text-sm text-rose-500">{filesError}</p> : null}
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
