"use client";

/**
 * FilePreviewInline
 * Inline preview for image / video / pdf / audio without requiring download.
 * Supported: JPG PNG WEBP GIF / MP4 MOV WEBM / PDF / MP3 WAV OGG
 */

import { FileText, Film, Music, Volume2 } from "lucide-react";

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

interface FilePreviewInlineProps {
  url: string;
  fileName?: string;
  fileType?: FileType;
  className?: string;
}

export function FilePreviewInline({ url, fileName, fileType, className = "" }: FilePreviewInlineProps) {
  const type = fileType ?? detectFileType(fileName ?? url);

  const base = `rounded-lg overflow-hidden bg-card border border-border/50 ${className}`;

  if (type === "image") {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
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
          src={url}
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
          src={`${url}#toolbar=0&view=FitH`}
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
        <Volume2 className="h-8 w-8 text-primary opacity-70" />
        <p className="text-xs text-muted-foreground truncate max-w-full">{fileName ?? "Audio File"}</p>
        <audio src={url} controls preload="metadata" className="w-full" />
      </div>
    );
  }

  // Generic document
  return (
    <div className={`${base} flex items-center gap-3 p-3`}>
      {type === "video" ? (
        <Film className="h-6 w-6 text-primary shrink-0" />
      ) : type === "audio" ? (
        <Music className="h-6 w-6 text-primary shrink-0" />
      ) : (
        <FileText className="h-6 w-6 text-primary shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{fileName ?? "File"}</p>
        <a
          href={url}
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
