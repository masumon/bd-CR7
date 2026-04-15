"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorUtils";

interface FileUploaderProps {
  module: string;
  category: string;
  subcategory?: string;
  projectId?: string;
  refTable?: string;
  refId?: string;
  onUploaded?: (url: string, fileId: string) => void;
}

export function FileUploader({ module, category, subcategory, projectId, refTable, refId, onUploaded }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { insertFile } = useProjectFiles();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);

    try {
      const url = await uploadToCloudinary(file);
      const saved = await insertFile({
        module,
        category,
        subcategory,
        project_id: projectId || null,
        ref_table: refTable || null,
        ref_id: refId || null,
        file_type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document",
        file_url: url,
        file_name: file.name,
        file_size_bytes: file.size,
        metadata: {
          mimeType: file.type || undefined,
          originalSizeBytes: file.size,
        },
      });
      setFile(null);
      setMessage("Upload complete");
      onUploaded?.(url, saved.id);
    } catch (error) {
      setMessage(getErrorMessage(error) || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-4">
      <label className="text-xs font-semibold text-muted-foreground">File Upload</label>
      <input
        type="file"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        aria-label="Choose file"
      />

      <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
        Upload
      </Button>

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
