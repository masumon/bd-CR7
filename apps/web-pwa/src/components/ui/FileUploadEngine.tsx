"use client";

/**
 * FileUploadEngine
 * Unified file upload component used across all ERP modules.
 * - Supports image / video / pdf / audio / docx / xlsx
 * - Mobile camera capture support
 * - Saves to project_files (Supabase) after Cloudinary upload
 * - Triggers AI classification via SUMONIX AI API
 */

import { FormEvent, useRef, useState } from "react";
import { Camera, FileUp, Loader2, Paperclip, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { Button } from "@/components/ui/button";
import { FilePreviewInline, detectFileType } from "@/components/ui/FilePreviewInline";
import { useProjectFiles, type InsertProjectFile } from "@/hooks/useProjectFiles";

const ACCEPTED = "image/*,video/*,audio/*,.pdf,.docx,.xlsx";
const CAMERA_ACCEPTED = "image/*,video/*";

interface FileUploadEngineProps {
  module: string;
  category: string;
  subcategory?: string;
  projectId?: string;
  refTable?: string;
  refId?: string;
  onUploaded?: (fileUrl: string, fileId: string) => void;
  compact?: boolean;
}

export function FileUploadEngine({
  module,
  category,
  subcategory,
  projectId,
  refTable,
  refId,
  onUploaded,
  compact = false,
}: FileUploadEngineProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { insertFile } = useProjectFiles();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMessage(null);
    setError(null);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    setUploading(true);
    setError(null);

    try {
      const fileUrl = await uploadToCloudinary(file);
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

      setMessage(`✓ Uploaded: ${file.name}`);
      onUploaded?.(fileUrl, saved.id);
      clearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!file ? (
        <div className="border-2 border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
          <FileUp className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">
            Tap to upload or use camera
          </p>
          <p id="file-upload-hint" className="sr-only">Choose a file or capture from camera.</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-xs h-8 px-3"
              aria-describedby="file-upload-hint"
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip className="h-3 w-3 mr-1" /> Choose File
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs h-8 px-3"
              aria-describedby="file-upload-hint"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-3 w-3 mr-1" /> Camera
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium truncate max-w-[200px]">{file.name}</p>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove selected file"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {preview && (
            <FilePreviewInline
              url={preview}
              fileName={file.name}
              className={compact ? "max-h-32" : ""}
            />
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        aria-label="Choose a file to upload"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
      />

      {/* Separate dedicated camera input with declarative capture attribute */}
      <input
        ref={cameraRef}
        type="file"
        accept={CAMERA_ACCEPTED}
        capture="environment"
        aria-label="Capture a photo or video"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
      />

      {file && (
        <Button
          type="submit"
          disabled={uploading}
          className="w-full btn-gold text-xs h-9"
        >
          {uploading ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading…</> : "Upload & Save"}
        </Button>
      )}

      {message && <p className="text-xs text-emerald-500">{message}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </form>
  );
}
