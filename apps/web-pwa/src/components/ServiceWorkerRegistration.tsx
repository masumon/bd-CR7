"use client";

import { useEffect } from "react";

import { setupOfflineSync } from "@/lib/offlineSync";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker in all environments
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Listen for messages from SW (e.g. SYNC_QUEUE trigger)
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "SYNC_QUEUE") {
              const ev = new CustomEvent("bdcr7:sync");
              window.dispatchEvent(ev);
            }
          });

          // Request background sync permission if supported
          if ("sync" in registration) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (registration as any).sync
              .register("bdcr7-queue-sync")
              .catch(() => {/* background sync not available */});
          }
        })
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("[SW] Registration failed:", err);
          }
        });
    }

    const cleanupOfflineSync = setupOfflineSync();

    return () => {
      cleanupOfflineSync();
    };
  }, []);

  return null;
}
