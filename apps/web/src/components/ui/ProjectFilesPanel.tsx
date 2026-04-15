"use client";

/**
 * ProjectFilesPanel
 * Reusable panel that shows all files for a given module/project/ref.
 * Provides inline preview (via MediaViewer modal), soft delete, and upload.
 */

import { useState } from "react";
import { FileText, Loader2, Trash2, Expand } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { detectFileType, getOptimizedPreviewUrl } from "@/components/ui/FilePreviewInline";
import { MediaViewer, useMediaViewer, type MediaItem } from "@/components/ui/MediaViewer";
import { FileUploadEngine } from "@/components/ui/FileUploadEngine";
import { useProjectFiles } from "@/hooks/useProjectFiles";

interface ProjectFilesPanelProps {
  module: string;
  category?: string;
  projectId?: string;
  refTable?: string;
  refId?: string;
  label?: string;
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

  const { selectedMedia, openMedia, closeMedia } = useMediaViewer();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const ok = await softDelete(deleteTarget);
    if (!ok) setDeleteError("Failed to delete file.");
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleOpenMedia = (f: { file_url: string; file_name?: string | null; created_at?: string }) => {
    const item: MediaItem = {
      url: f.file_url,
      fileName: f.file_name ?? undefined,
      uploadedAt: f.created_at,
      relatedModule: module,
      description: "description" in f ? (f.description as string | null) ?? undefined : undefined,
      tags: "tags" in f ? (f.tags as string[] | undefined) : undefined,
      fileSizeBytes: "file_size_bytes" in f ? (f.file_size_bytes as number | null) ?? undefined : undefined,
      metadata: "metadata" in f ? (f.metadata as MediaItem["metadata"]) : undefined,
    };
    openMedia(item);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              {label ?? "Files & Evidence"}
              {files.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-[11px] text-primary font-semibold">
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
              {files.map((f) => {
                const fileType = detectFileType(f.file_name ?? f.file_url);
                const isPreviewable = ["image", "video"].includes(fileType);
                const thumbnailSrc = getOptimizedPreviewUrl(f.thumbnail_url || f.file_url, fileType as "image" | "video" | "pdf" | "audio" | "document", "card");

                return (
                  <div
                    key={f.id}
                    className="rounded-lg border border-border/40 bg-card/50 p-2 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{f.file_name ?? "File"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {f.module}/{f.category}
                          {f.ai_classified && (
                            <span className="ml-1 text-primary">· AI ✓</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Open in MediaViewer */}
                        <button
                          type="button"
                          onClick={() => handleOpenMedia(f)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                          title="Full screen preview"
                        >
                          <Expand className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(f.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Clickable thumbnail for image/video */}
                    {isPreviewable ? (
                      <button
                        type="button"
                        onClick={() => handleOpenMedia(f)}
                        className="block w-full overflow-hidden rounded-lg border border-border/30 hover:border-primary/40 transition-colors group"
                        title="Click to view full screen"
                      >
                        {fileType === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnailSrc}
                            alt={f.file_name ?? "Preview"}
                            className="w-full max-h-40 object-cover group-hover:opacity-90 transition-opacity"
                            loading="lazy"
                          />
                        ) : (
                          <video
                            src={f.file_url}
                            preload="none"
                            poster={thumbnailSrc}
                            className="w-full max-h-40 object-cover"
                            muted
                          />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenMedia(f)}
                        className="flex w-full items-center gap-2 rounded-lg border border-border/30 bg-muted/40 px-3 py-2 hover:border-primary/40 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {f.file_name ?? "Open file"}
                        </span>
                        <Expand className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      </button>
                    )}

                    {f.extracted_text && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 border-t border-border/30 pt-1">
                        {f.extracted_text}
                      </p>
                    )}
                    {f.metadata?.location?.label ? (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        {f.metadata.location.label}
                      </p>
                    ) : null}
                  </div>
                );
              })}
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

      {/* Full-screen media viewer */}
      <MediaViewer item={selectedMedia} onClose={closeMedia} />
    </>
  );
}
