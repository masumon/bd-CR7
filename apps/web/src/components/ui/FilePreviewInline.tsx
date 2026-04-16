"use client";

/**
 * FilePreviewInline
 * Inline preview for image / video / pdf / audio without requiring download.
 * Supported: JPG PNG WEBP GIF / MP4 MOV WEBM / PDF / MP3 WAV OGG
 */

import { FileText } from "lucide-react";
import { PdfFrame } from "@/components/ui/PdfFrame";

export type FileType = "image" | "video" | "pdf" | "audio" | "document";

export type FileLocationMetadata = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt?: string;
  label?: string;
};

export type FileMetadata = {
  mimeType?: string;
  originalSizeBytes?: number;
  location?: FileLocationMetadata;
};

export function detectFileType(urlOrName: string): FileType {
  const s = urlOrName.toLowerCase().split("?")[0];
  if (/\.(jpg|jpeg|png|webp|gif|svg)/.test(s)) return "image";
  if (/\.(mp4|mov|webm|avi|mkv)/.test(s)) return "video";
  if (/\.pdf/.test(s)) return "pdf";
  if (/\.(mp3|wav|ogg|m4a|aac)/.test(s)) return "audio";
  if (/cloudinary\.com\/video\//.test(s)) return "video";
  if (/cloudinary\.com\/image\//.test(s)) return "image";
  if (/cloudinary\.com\/raw\//.test(s)) return "document";
  return "document";
}

/** 
 * Validates URLs using the URL API to block javascript: and other unsafe schemes.
 * Returns the original URL for safe schemes, or "about:blank" as a safe fallback.
 */
function safeUrl(url: string): string {
  // Allow blob: URLs (local file previews) — they are same-origin safe
  if (url.startsWith("blob:")) return url;
  // Allow root-relative paths
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return url;
    }
    return "about:blank";
  } catch {
    return "about:blank";
  }
}

function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 100 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}

export function getLocationMapEmbedUrl(location?: FileLocationMetadata | null): string | null {
  if (!location) return null;
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const delta = 0.01;
  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function getCloudinaryTransformedUrl(url: string, transform: string): string {
  const parsed = tryParseUrl(url);
  if (!parsed || parsed.hostname !== "res.cloudinary.com") return url;
  const marker = "/upload/";
  const index = parsed.pathname.indexOf(marker);
  if (index === -1) return url;
  const before = parsed.pathname.slice(0, index + marker.length);
  const after = parsed.pathname.slice(index + marker.length);
  return `${parsed.origin}${before}${transform}/${after}${parsed.search}`;
}

export function getOptimizedPreviewUrl(url: string, fileType: FileType, variant: "card" | "viewer" = "card"): string {
  if (fileType === "image") {
    return getCloudinaryTransformedUrl(
      url,
      variant === "card" ? "f_auto,q_auto,w_960,h_960,c_limit" : "f_auto,q_auto,w_1800,h_1800,c_limit"
    );
  }

  if (fileType === "video") {
    return getCloudinaryTransformedUrl(
      url,
      variant === "card" ? "so_0,f_jpg,q_auto,w_960,h_960,c_fill" : "so_0,f_jpg,q_auto,w_1600,h_1200,c_limit"
    );
  }

  return url;
}

interface FilePreviewInlineProps {
  url: string;
  fileName?: string;
  fileType?: FileType;
  className?: string;
}

export function FilePreviewInline({ url, fileName, fileType, className = "" }: FilePreviewInlineProps) {
  const type = fileType ?? detectFileType(fileName ?? url);
  const safeSrc = safeUrl(url);
  const optimizedImageSrc = getOptimizedPreviewUrl(safeSrc, type, "card");

  const base = `rounded-lg overflow-hidden bg-card border border-border/50 ${className}`;

  if (type === "image") {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizedImageSrc}
          alt={fileName ?? "Preview"}
          className="w-full max-h-64 object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className={base}>
        <video
          src={safeSrc}
          controls
          playsInline
          preload="none"
          poster={getOptimizedPreviewUrl(safeSrc, type, "card")}
          className="w-full max-h-64"
        />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className={base}>
        <PdfFrame
          url={safeSrc}
          title={fileName ?? "PDF Preview"}
          className="w-full h-64 border-0"
        />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className={`${base} flex flex-col items-center gap-2 p-4`}>
        <p className="text-xs text-muted-foreground truncate max-w-full">{fileName ?? "Audio File"}</p>
        <audio src={safeSrc} controls preload="metadata" className="w-full" />
      </div>
    );
  }

  // Generic document
  return (
    <div className={`${base} flex items-center gap-3 p-3`}>
      <FileText className="h-6 w-6 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{fileName ?? "File"}</p>
        <a
          href={safeSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-primary hover:underline"
        >
          Open / Download
        </a>
      </div>
    </div>
  );
}
