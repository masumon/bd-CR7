"use client";

import { useEffect, useMemo, useState } from "react";

import { getAccessToken } from "@/lib/authSession";
import { getErrorMessage } from "@/lib/errorUtils";

type PdfFrameProps = {
  url: string;
  title: string;
  className: string;
};

function isSafeUrl(url: string): boolean {
  if (url.startsWith("blob:") || url.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isSameOriginUrl(url: string): boolean {
  if (url.startsWith("/")) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function PdfFrame({ url, title, className }: PdfFrameProps) {
  const safeUrl = useMemo(() => (isSafeUrl(url) ? url : "about:blank"), [url]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let activeObjectUrl: string | null = null;

    async function loadPdf() {
      setError(null);
      setBlobUrl(null);
      setDirectUrl(null);

      if (safeUrl === "about:blank") {
        setError("PDF preview is unavailable.");
        return;
      }

      if (!isSameOriginUrl(safeUrl)) {
        setDirectUrl(safeUrl);
        return;
      }

      try {
        const token = await getAccessToken();
        const headers = new Headers({ accept: "application/pdf" });
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }

        const response = await fetch(safeUrl, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers,
        });

        if (!response.ok) {
          throw new Error(`PDF preview failed (${response.status})`);
        }

        const blob = await response.blob();
        activeObjectUrl = URL.createObjectURL(
          blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" })
        );

        if (!disposed) {
          setBlobUrl(activeObjectUrl);
        }
      } catch (loadError) {
        if (!disposed) {
          setError(getErrorMessage(loadError));
          setDirectUrl(safeUrl);
        }
      }
    }

    void loadPdf();

    return () => {
      disposed = true;
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [safeUrl]);

  const resolvedUrl = blobUrl || directUrl;

  if (!resolvedUrl && !error) {
    return <div className={`${className} bg-card/60`} aria-busy="true" />;
  }

  if (!resolvedUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-card/60 px-4 text-center text-xs text-muted-foreground`}>
        {error || "PDF preview is unavailable."}
      </div>
    );
  }

  return (
    <iframe
      src={`${resolvedUrl}#toolbar=0&view=FitH`}
      title={title}
      className={className}
      loading="lazy"
    />
  );
}