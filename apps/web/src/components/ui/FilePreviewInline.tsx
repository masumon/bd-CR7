"use client";

/**
 * FilePreviewInline
 * Inline preview for image / video / pdf / audio without requiring download.
 * Supported: JPG PNG WEBP GIF / MP4 MOV WEBM / PDF / MP3 WAV OGG
 */

import { FileText } from "lucide-react";

export type FileType = "image" | "video" | "pdf" | "audio" | "document";

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

interface FilePreviewInlineProps {
  url: string;
  fileName?: string;
  fileType?: FileType;
  className?: string;
}

export function FilePreviewInline({ url, fileName, fileType, className = "" }: FilePreviewInlineProps) {
  const type = fileType ?? detectFileType(fileName ?? url);
  const safeSrc = safeUrl(url);

  const base = `rounded-lg overflow-hidden bg-card border border-border/50 ${className}`;

  if (type === "image") {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safeSrc}
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
          preload="metadata"
          className="w-full max-h-64"
        />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className={base}>
        <iframe
          src={`${safeSrc}#toolbar=0&view=FitH`}
          title={fileName ?? "PDF Preview"}
          className="w-full h-64 border-0"
          loading="lazy"
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
