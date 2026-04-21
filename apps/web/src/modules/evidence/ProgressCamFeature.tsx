"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  detectFileType,
  getLocationMapEmbedUrl,
  getOptimizedPreviewUrl,
  type FileLocationMetadata,
} from "@/components/ui/FilePreviewInline";
import { MediaViewer, useMediaViewer } from "@/components/ui/MediaViewer";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { FileUploader } from "@/modules/_shared";
import { getErrorMessage } from "@/lib/errorUtils";
import { getCurrentPosition } from "@/lib/permissionHelpers";

const PHASES = ["Foundation", "Structure", "Finishing", "Handover"];

type ProgressEntry = {
  media_url: string;
  phase_category: string;
  caption: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  created_at?: string;
  metadata?: {
    location?: FileLocationMetadata;
  };
};

function LocationLiveCard({
  onLocationChange,
}: {
  onLocationChange: (location: FileLocationMetadata | null) => void;
}) {
  const [currentLocation, setCurrentLocation] = useState<FileLocationMetadata | null>(null);
  const [status, setStatus] = useState("লোকেশন চালু হলে এখানে live map দেখা যাবে");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("এই ডিভাইসে location support পাওয়া যায়নি");
      onLocationChange(null);
      return;
    }

    const syncLocation = (coords: GeolocationCoordinates) => {
      const nextLocation: FileLocationMetadata = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: Math.round(coords.accuracy),
        capturedAt: new Date().toISOString(),
        label: "Mobile live location attached",
      };
      setCurrentLocation(nextLocation);
      onLocationChange(nextLocation);
      setStatus("আপনার বর্তমান লোকেশন live map-এ দেখানো হচ্ছে");
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => syncLocation(position.coords),
      () => {
        setStatus("লোকেশন পাওয়া যায়নি, পরে আবার চেষ্টা করুন");
        onLocationChange(null);
      },
      { enableHighAccuracy: true, maximumAge: 20_000, timeout: 12_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocationChange]);

  const refreshLocation = async () => {
    try {
      setStatus("লোকেশন আপডেট করা হচ্ছে...");
      const coords = await getCurrentPosition();
      const nextLocation: FileLocationMetadata = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: Math.round(coords.accuracy),
        capturedAt: new Date().toISOString(),
        label: "Mobile live location attached",
      };
      setCurrentLocation(nextLocation);
      onLocationChange(nextLocation);
      setStatus("লোকেশন আপডেট হয়েছে");
    } catch {
      setStatus("লোকেশন আপডেট করা যায়নি");
    }
  };

  const mapEmbedUrl = getLocationMapEmbedUrl(currentLocation);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Live Location Map</p>
          <p className="mt-1 text-xs text-muted-foreground">{status}</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshLocation()}
          className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40"
        >
          Refresh Location
        </button>
      </div>
      {mapEmbedUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-background">
          <iframe
            title="Current location map"
            src={mapEmbedUrl}
            loading="lazy"
            className="h-56 w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      {currentLocation?.accuracyMeters ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Approximate accuracy: {currentLocation.accuracyMeters}m
        </p>
      ) : null}
    </div>
  );
}

export function ProgressCamFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phaseCategory, setPhaseCategory] = useState(PHASES[0]);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<FileLocationMetadata | null>(null);
  const { selectedMedia, openMedia, closeMedia } = useMediaViewer();

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
        file_name: row.file_name,
        file_size_bytes: row.file_size_bytes,
        created_at: row.created_at,
        metadata: row.metadata,
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
        metadata: {
          mimeType: file.type || undefined,
          originalSizeBytes: file.size,
          location: currentLocation ?? undefined,
        },
      });

      setMessage("Progress media uploaded");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setFile(null);
      setCaption("");
      setCurrentLocation(null);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  /** File input shared between upload and camera fallback */
  const fileInput = (
    <input
      className="app-field"
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
    <section className="module app-panel module-surface rounded-[1.25rem] p-4 shadow-soft sm:p-5">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">Progress Visualizer</h3>
        <p className="mt-1 text-sm text-muted-foreground">Upload image or video evidence by phase category with a clearer visual log.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <PermissionGate type="location">
            <LocationLiveCard onLocationChange={setCurrentLocation} />
          </PermissionGate>
        </div>
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
        <select className="app-select" title="Phase category" value={phaseCategory} onChange={(e) => setPhaseCategory(e.target.value)}>
          {PHASES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea className="app-textarea min-h-[2.85rem]" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" rows={2} />
        {previewUrl ? (
          <div className="rounded-2xl border border-border/70 bg-background/75 p-3 md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Preview</p>
              {currentLocation ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Live location attached
                </span>
              ) : null}
            </div>
            {file && file.type.startsWith("video/") ? (
              <video className="h-48 w-full rounded-xl object-cover" controls preload="none" poster={getOptimizedPreviewUrl(previewUrl, "video", "card")} src={previewUrl} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getOptimizedPreviewUrl(previewUrl, "image", "card")} alt="Selected progress preview" className="h-48 w-full rounded-xl object-cover" />
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

      <div className="mt-4">
        <FileUploader module="evidence" category="progress" subcategory={phaseCategory} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, 12).map((entry, idx) => (
          <button
            key={`${entry.media_url}-${idx}`}
            type="button"
            onClick={() => {
              openMedia({
                url: entry.media_url,
                fileName: entry.file_name ?? undefined,
                uploadedAt: entry.created_at,
                description: entry.caption || undefined,
                relatedModule: "evidence",
                fileSizeBytes: entry.file_size_bytes,
                metadata: entry.metadata,
                tags: [entry.phase_category],
              });
            }}
            className="rounded-xl border border-border/70 bg-background/75 px-3 py-3 text-left transition hover:border-primary/50"
          >
            <p className="font-medium text-foreground">{entry.phase_category}</p>
            <p className="mt-1 truncate">{entry.caption || "No caption provided"}</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border/60 bg-background/90">
              {isVideo(entry.media_url) ? (
                <video className="h-44 w-full object-cover" muted preload="none" poster={getOptimizedPreviewUrl(entry.media_url, "video", "card")} src={entry.media_url} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getOptimizedPreviewUrl(entry.media_url, "image", "card")} alt={entry.caption || entry.phase_category} className="h-44 w-full object-cover" loading="lazy" />
              )}
            </div>
            {entry.created_at ? <p className="mt-2 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p> : null}
            {entry.metadata?.location?.label ? <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">{entry.metadata.location.label}</p> : null}
          </button>
        ))}
      </div>
      <MediaViewer item={selectedMedia} onClose={closeMedia} />
      {filesError ? <p className="mt-3 text-sm text-rose-500">{filesError}</p> : null}
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
