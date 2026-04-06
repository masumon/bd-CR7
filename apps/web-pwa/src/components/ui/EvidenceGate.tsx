"use client";

/**
 * EvidenceGate
 * ─────────────────────────────────────────────
 * Enforcement wrapper that requires at least ONE proof file before a
 * parent form can be submitted.
 *
 * Usage:
 *   <EvidenceGate
 *     module="finance"
 *     category="expense"
 *     severity="block"           // 'block' | 'warn'
 *     onFileReady={({ fileId, fileUrl }) => setProofFileId(fileId)}
 *   />
 *
 * The caller's submit button must be disabled when proofFileId is null.
 * EvidenceGate only handles upload + AI classify + pass ID upward.
 */

import { useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, FileUp, Loader2, Paperclip, ShieldAlert, X } from "lucide-react";
import { uploadToCloudinary } from "@bdcr7/media-engine";
import { FilePreviewInline, detectFileType } from "@/components/ui/FilePreviewInline";
import { useProjectFiles, type InsertProjectFile } from "@/hooks/useProjectFiles";

const ACCEPTED = "image/*,video/*,audio/*,.pdf,.docx,.xlsx";
const CAMERA_ACCEPTED = "image/*,video/*";

export interface EvidenceGateFileReady {
  fileId: string;
  fileUrl: string;
  fileName: string;
}

interface EvidenceGateProps {
  module: string;
  category: string;
  subcategory?: string;
  projectId?: string;
  refTable?: string;
  refId?: string;
  severity?: "block" | "warn";
  label?: string;
  onFileReady?: (info: EvidenceGateFileReady) => void;
  onCleared?: () => void;
}

export function EvidenceGate({
  module,
  category,
  subcategory,
  projectId,
  refTable,
  refId,
  severity = "block",
  label,
  onFileReady,
  onCleared,
}: EvidenceGateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { insertFile } = useProjectFiles();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [savedFileId, setSavedFileId] = useState<string | null>(null);
  const [savedFileUrl, setSavedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

  const handleSelect = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setSavedFileId(null);
    setSavedFileUrl(null);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setSavedFileId(null);
    setSavedFileUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared?.();
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const fileUrl = await uploadToCloudinary({ cloudName, uploadPreset, file });
      const fileType = detectFileType(file.name);

      const payload: InsertProjectFile = {
        project_id: projectId ?? null,
        module,
        category,
        subcategory: subcategory ?? null,
        file_type: fileType,
        file_url: fileUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        ref_table: refTable ?? null,
        ref_id: refId ?? null,
      };

      const saved = await insertFile(payload);

      setSavedFileId(saved.id);
      setSavedFileUrl(fileUrl);
      onFileReady?.({ fileId: saved.id, fileUrl, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Already uploaded — show success state
  if (savedFileId) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Proof uploaded
              {classifying && (
                <span className="ml-2 text-muted-foreground inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> AI classifying…
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="text-muted-foreground hover:text-rose-500 transition-colors"
            title="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {preview && (
          <FilePreviewInline
            url={preview}
            fileName={file?.name}
            fileType={detectFileType(file?.name ?? "")}
            className="max-h-24"
          />
        )}
        <p className="text-[10px] text-muted-foreground truncate">{file?.name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Enforcement banner */}
      <div
        className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${
          severity === "block"
            ? "border border-rose-500/25 bg-rose-500/8 text-rose-600 dark:text-rose-400"
            : "border border-amber-500/25 bg-amber-500/8 text-amber-600 dark:text-amber-400"
        }`}
      >
        {severity === "block" ? (
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        )}
        <span>
          {label ??
            (severity === "block"
              ? "Proof file required before saving. Upload invoice, photo, or document."
              : "Recommended: attach proof file for this entry.")}
        </span>
      </div>

      {/* File preview or drop area */}
      {file ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium truncate max-w-[220px]">{file.name}</p>
            <button
              type="button"
              onClick={clearFile}
              className="text-muted-foreground hover:text-rose-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {preview && (
            <FilePreviewInline
              url={preview}
              fileName={file.name}
              className="max-h-28"
            />
          )}
          <button
            type="button"
            onClick={() => void upload()}
            disabled={uploading}
            className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {uploading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</>
            ) : (
              <><FileUp className="h-3 w-3" /> Upload Proof</>
            )}
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border/50 rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <FileUp className="h-5 w-5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground text-center">
            Tap to attach proof or use camera
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <Paperclip className="h-3 w-3" /> File
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
            >
              <Camera className="h-3 w-3" /> Camera
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelect(f); }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept={CAMERA_ACCEPTED}
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelect(f); }}
      />
    </div>
  );
}
