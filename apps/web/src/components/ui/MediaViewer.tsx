"use client";

/**
 * MediaViewer — Full-screen modal with zoom + details panel.
 * Supports image / video / pdf / audio / document.
 * Uses framer-motion for smooth open/close animation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileText,
  Calendar,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  MapPinned,
  HardDrive,
} from "lucide-react";

import {
  detectFileType,
  formatFileSize,
  getLocationMapEmbedUrl,
  getOptimizedPreviewUrl,
  type FileMetadata,
} from "@/components/ui/FilePreviewInline";
import { PdfFrame } from "@/components/ui/PdfFrame";

export interface MediaItem {
  url: string;
  fileName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  description?: string;
  tags?: string[];
  relatedModule?: string;
  relatedId?: string;
  fileSizeBytes?: number | null;
  metadata?: FileMetadata | null;
}

interface MediaViewerProps {
  item: MediaItem | null;
  onClose: () => void;
}

function safeUrl(url: string): string {
  if (url.startsWith("blob:") || url.startsWith("/")) return url;
  try {
    const p = new URL(url);
    if (p.protocol === "https:" || p.protocol === "http:") return url;
    return "about:blank";
  } catch {
    return "about:blank";
  }
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;

export function MediaViewer({ item, onClose }: MediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset zoom on new item
  useEffect(() => {
    setZoom(1);
    setShowDetails(false);
  }, [item?.url]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  if (!item) return null;

  const fileType = detectFileType(item.fileName ?? item.url);
  const safeSrc = safeUrl(item.url);
  const isImage = fileType === "image";
  const isVideo = fileType === "video";
  const mapEmbedUrl = getLocationMapEmbedUrl(item.metadata?.location);
  const viewerImageSrc = getOptimizedPreviewUrl(safeSrc, fileType, "viewer");
  const fileSizeLabel = formatFileSize(item.fileSizeBytes ?? item.metadata?.originalSizeBytes ?? null);

  const formattedDate = item.uploadedAt
    ? new Date(item.uploadedAt).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key="media-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col bg-black/88 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* ── Top Bar ── */}
        <div className="shrink-0 border-b border-border/40 bg-black/45 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="max-w-[58vw] truncate text-sm font-medium text-white/90">
              {item.fileName ?? "File Preview"}
            </p>
            <div className="flex items-center gap-2">
            {/* Zoom controls (image only) */}
            {isImage && (
              <>
                <button
                  onClick={zoomOut}
                  disabled={zoom <= ZOOM_MIN}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center font-mono text-xs text-white/80">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= ZOOM_MAX}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <a
              href={safeSrc}
              download={item.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-rose-500/80"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            </div>
          </div>
        </div>

        {/* ── Media Area ── */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
          <motion.div
            key="media-content"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isImage && (
              <motion.div
                animate={{ scale: zoom }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={zoom > 1 ? "cursor-grab" : "cursor-default"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={viewerImageSrc}
                  alt={item.fileName ?? "Preview"}
                  className="max-h-[65vh] max-w-[90vw] select-none rounded-xl object-contain shadow-2xl"
                  draggable={false}
                />
              </motion.div>
            )}

            {isVideo && (
              <video
                src={safeSrc}
                controls
                playsInline
                preload="metadata"
                poster={getOptimizedPreviewUrl(safeSrc, fileType, "viewer")}
                className="max-h-[65vh] max-w-[90vw] rounded-xl shadow-2xl"
              />
            )}

            {fileType === "pdf" && (
              <PdfFrame
                url={safeSrc}
                title={item.fileName ?? "PDF"}
                className="h-[65vh] w-[min(90vw,800px)] rounded-xl border border-border/40"
              />
            )}

            {fileType === "audio" && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card/80 p-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm text-foreground">{item.fileName ?? "Audio"}</p>
                <audio src={safeSrc} controls preload="metadata" className="w-64" />
              </div>
            )}

            {fileType === "document" && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card/80 p-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{item.fileName ?? "Document"}</p>
                <a
                  href={safeSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Open / Download
                </a>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Details Panel ── */}
        {(item.uploadedBy || item.uploadedAt || item.description || item.relatedModule || item.fileSizeBytes || item.metadata?.originalSizeBytes || mapEmbedUrl || (item.tags?.length ?? 0) > 0) && (
          <div className="shrink-0 border-t border-border/40 bg-black/55">
            {/* Toggle */}
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-white/70 transition-colors hover:text-white"
            >
              <span className="font-medium tracking-wide uppercase">
                {showDetails ? "Hide Details" : "Show Details"}
              </span>
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
                    {item.uploadedBy && (
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/45">আপলোড করেছেন</p>
                          <p className="text-sm text-white/85">{item.uploadedBy}</p>
                        </div>
                      </div>
                    )}
                    {formattedDate && (
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/45">তারিখ</p>
                          <p className="text-sm text-white/85">{formattedDate}</p>
                        </div>
                      </div>
                    )}
                    {item.relatedModule && (
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/45">মডিউল</p>
                          <p className="text-sm capitalize text-white/85">{item.relatedModule}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/45">ফাইল সাইজ</p>
                        <p className="text-sm text-white/85">{fileSizeLabel}</p>
                      </div>
                    </div>
                    {(item.tags?.length ?? 0) > 0 && (
                      <div className="flex items-start gap-2">
                        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/45">ট্যাগ</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.tags!.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] text-primary"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {item.description && (
                      <div className="col-span-2 flex items-start gap-2 sm:col-span-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/45">বিবরণ</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-white/80">{item.description}</p>
                        </div>
                      </div>
                    )}
                    {mapEmbedUrl && (
                      <div className="col-span-2 sm:col-span-4">
                        <div className="mb-2 flex items-center gap-2 text-white/80">
                          <MapPinned className="h-4 w-4 text-primary" />
                          <p className="text-[11px] uppercase tracking-wider text-white/45">লোকেশন ম্যাপ</p>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                          <iframe
                            title="Location map"
                            src={mapEmbedUrl}
                            loading="lazy"
                            className="h-44 w-full border-0"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                        <p className="mt-2 text-xs text-white/55">
                          Upload-এর সময় mobile location থেকে এই map save করা হয়েছে।
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Hook for easy usage ──────────────────────────────────────────────────────

import { useState as useStateHook } from "react";

export function useMediaViewer() {
  const [selectedMedia, setSelectedMedia] = useStateHook<MediaItem | null>(null);
  return {
    selectedMedia,
    openMedia: (item: MediaItem) => setSelectedMedia(item),
    closeMedia: () => setSelectedMedia(null),
  };
}
