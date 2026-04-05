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
import { uploadToCloudinary } from "@bdcr7/media-engine";
import { Button } from "@/components/ui/button";
import { FilePreviewInline, detectFileType } from "@/components/ui/FilePreviewInline";
import { useProjectFiles, type InsertProjectFile } from "@/hooks/useProjectFiles";
import { apiRequest } from "@/lib/api";

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

interface AiClassifyResult {
  module?: string;
  category?: string;
  extracted_text?: string;
  confidence?: number;
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiClassifyResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMessage(null);
    setError(null);
    setAiResult(null);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setAiResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const classifyWithAI = async (fileUrl: string, fileName: string) => {
    setAiLoading(true);
    try {
      const prompt = `Classify this file for a construction ERP. File: "${fileName}", URL: ${fileUrl}. Respond JSON: {module, category, extracted_text, confidence}`;
      const res = await apiRequest<{ reply?: string }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: prompt, intent: "file_classify" }),
      });
      if (res?.reply) {
        try {
          const json = JSON.parse(res.reply) as AiClassifyResult;
          setAiResult(json);
        } catch (parseErr) {
          // AI returned non-JSON; this is expected when the AI gives a narrative response
          if (process.env.NODE_ENV === "development") {
            console.debug("[FileUploadEngine] AI reply not JSON:", parseErr);
          }
        }
      }
    } catch {
      // AI classify failed; non-blocking
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
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

      if (saved) {
        setMessage(`✓ Uploaded: ${file.name}`);
        onUploaded?.(fileUrl, saved.id);
        // Trigger AI classification asynchronously
        void classifyWithAI(fileUrl, file.name);
        clearFile();
      } else {
        setError("Upload succeeded but failed to save file record.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!file ? (
        <div
          className="border-2 border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <FileUp className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">
            Tap to upload or use camera
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-xs h-8 px-3"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <Paperclip className="h-3 w-3 mr-1" /> Choose File
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs h-8 px-3"
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
            >
              <Camera className="h-3 w-3 mr-1" /> Camera
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium truncate max-w-[200px]">{file.name}</p>
            <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground">
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
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
      />

      {/* Separate dedicated camera input with declarative capture attribute */}
      <input
        ref={cameraRef}
        type="file"
        accept={CAMERA_ACCEPTED}
        capture="environment"
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

      {aiLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>SUMONIX AI is classifying file…</span>
        </div>
      )}

      {aiResult && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs space-y-1">
          <p className="font-semibold text-primary">AI Classification</p>
          {aiResult.module && <p>Module: <span className="font-medium">{aiResult.module}</span></p>}
          {aiResult.category && <p>Category: <span className="font-medium">{aiResult.category}</span></p>}
          {aiResult.extracted_text && (
            <p className="text-muted-foreground line-clamp-2">Extracted: {aiResult.extracted_text}</p>
          )}
          {aiResult.confidence && (
            <p>Confidence: <span className="font-medium">{Math.round(aiResult.confidence * 100)}%</span></p>
          )}
        </div>
      )}
    </form>
  );
}
