"use client";

/**
 * ProjectFilesPanel
 * Reusable panel that shows all files for a given module/project/ref.
 * Provides inline preview, soft delete, and upload.
 */

import { useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FilePreviewInline, detectFileType } from "@/components/ui/FilePreviewInline";
import { FileUploadEngine } from "@/components/ui/FileUploadEngine";
import { useProjectFiles } from "@/hooks/useProjectFiles";

interface ProjectFilesPanelProps {
  module: string;
  category?: string;
  projectId?: string;
  refTable?: string;
  refId?: string;
  /** shown in the card title */
  label?: string;
  /** subcategory for new uploads */
  subcategory?: string;
}

export function ProjectFilesPanel({
  module,
  category = "general",
  projectId,
  refTable,
  refId,
  label,
  subcategory,
}: ProjectFilesPanelProps) {
  const { files, loading, error, loadFiles, softDelete } = useProjectFiles({
    module,
    category,
    project_id: projectId,
    ref_table: refTable,
    ref_id: refId,
  });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const ok = await softDelete(deleteTarget);
    if (!ok) setDeleteError("Failed to delete file.");
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            {label ?? "Files & Evidence"}
            {files.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary font-semibold">
                {files.length}
              </span>
            )}
          </CardTitle>
          <Button
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={() => setShowUpload((v) => !v)}
          >
            {showUpload ? "Hide Upload" : "Upload"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showUpload && (
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <FileUploadEngine
              module={module}
              category={category}
              subcategory={subcategory}
              projectId={projectId}
              refTable={refTable}
              refId={refId}
              onUploaded={() => { void loadFiles(); setShowUpload(false); }}
              compact
            />
          </div>
        )}

        {error && <p className="text-xs text-rose-500">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No files yet. Upload evidence to continue.
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-border/40 bg-card/50 p-2 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{f.file_name ?? "File"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.module}/{f.category}
                      {f.ai_classified && (
                        <span className="ml-1 text-primary">· AI ✓</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(f.id)}
                    className="shrink-0 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <FilePreviewInline
                  url={f.file_url}
                  fileName={f.file_name ?? undefined}
                  fileType={detectFileType(f.file_name ?? f.file_url)}
                />
                {f.extracted_text && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2 border-t border-border/30 pt-1">
                    {f.extracted_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete File"
      >
        <p className="mb-3 text-sm">This file will be archived (soft delete). Continue?</p>
        {deleteError && <p className="mb-2 text-xs text-rose-500">{deleteError}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
