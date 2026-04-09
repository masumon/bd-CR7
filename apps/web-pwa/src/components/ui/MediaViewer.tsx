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
} from "lucide-react";

import { detectFileType } from "@/components/ui/FilePreviewInline";

export interface MediaItem {
  url: string;
  fileName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  description?: string;
  tags?: string[];
  relatedModule?: string;
  relatedId?: string;
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
        className="fixed inset-0 z-[200] flex flex-col"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
      >
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 shrink-0">
          <p className="truncate text-sm font-medium text-white/90 max-w-[60vw]">
            {item.fileName ?? "File Preview"}
          </p>
          <div className="flex items-center gap-2">
            {/* Zoom controls (image only) */}
            {isImage && (
              <>
                <button
                  onClick={zoomOut}
                  disabled={zoom <= ZOOM_MIN}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs text-white/70 font-mono">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= ZOOM_MAX}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
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
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-rose-500/80 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={safeSrc}
                alt={item.fileName ?? "Preview"}
                className="rounded-xl shadow-2xl object-contain transition-transform duration-200 select-none"
                style={{
                  maxHeight: "65vh",
                  maxWidth: "90vw",
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  cursor: zoom > 1 ? "grab" : "default",
                }}
                draggable={false}
              />
            )}

            {isVideo && (
              <video
                src={safeSrc}
                controls
                playsInline
                preload="metadata"
                className="rounded-xl shadow-2xl"
                style={{ maxHeight: "65vh", maxWidth: "90vw" }}
              />
            )}

            {fileType === "pdf" && (
              <iframe
                src={`${safeSrc}#toolbar=0&view=FitH`}
                title={item.fileName ?? "PDF"}
                className="rounded-xl border border-white/10"
                style={{ width: "min(90vw, 800px)", height: "65vh" }}
                sandbox="allow-same-origin"
              />
            )}

            {fileType === "audio" && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm text-white/80">{item.fileName ?? "Audio"}</p>
                <audio src={safeSrc} controls preload="metadata" className="w-64" />
              </div>
            )}

            {fileType === "document" && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm font-medium text-white/90">{item.fileName ?? "Document"}</p>
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
        {(item.uploadedBy || item.uploadedAt || item.description || (item.tags?.length ?? 0) > 0) && (
          <div className="shrink-0 border-t border-white/10 bg-black/50">
            {/* Toggle */}
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-white/60 hover:text-white/90 transition-colors"
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
                          <p className="text-[10px] uppercase tracking-wider text-white/40">আপলোড করেছেন</p>
                          <p className="text-xs text-white/80">{item.uploadedBy}</p>
                        </div>
                      </div>
                    )}
                    {formattedDate && (
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/40">তারিখ</p>
                          <p className="text-xs text-white/80">{formattedDate}</p>
                        </div>
                      </div>
                    )}
                    {item.relatedModule && (
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/40">মডিউল</p>
                          <p className="text-xs capitalize text-white/80">{item.relatedModule}</p>
                        </div>
                      </div>
                    )}
                    {(item.tags?.length ?? 0) > 0 && (
                      <div className="flex items-start gap-2">
                        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-white/40">ট্যাগ</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.tags!.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary"
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
                          <p className="text-[10px] uppercase tracking-wider text-white/40">বিবরণ</p>
                          <p className="text-xs text-white/70 leading-relaxed mt-0.5">{item.description}</p>
                        </div>
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
