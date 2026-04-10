"use client";

import { useEffect } from "react";

import { setupOfflineSync } from "@/lib/offlineSync";

const SW_RESET_KEY = "bdcr7-sw-reset-2026-04-05";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    let mounted = true;

    const registerServiceWorker = async () => {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return;
      }

      try {
        // One-time reset to remove stale workers/caches from older versions.
        if (window.localStorage.getItem(SW_RESET_KEY) !== "done") {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));

          if ("caches" in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((key) => caches.delete(key)));
          }

          window.localStorage.setItem(SW_RESET_KEY, "done");
        }

        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (!mounted) {
          return;
        }

        // Listen for messages from SW (e.g. SYNC_QUEUE trigger)
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SYNC_QUEUE") {
            const ev = new CustomEvent("bdcr7:sync");
            window.dispatchEvent(ev);
          }
        });

        // Request background sync permission if supported
        if ("sync" in registration) {
          type SyncRegistration = ServiceWorkerRegistration & {
            sync: { register(tag: string): Promise<void> };
          };
          (registration as SyncRegistration).sync
            .register("bdcr7-queue-sync")
            .catch((err) => {
              if (process.env.NODE_ENV === "development") {
                console.warn("[SW] Background sync registration failed:", err);
              }
            });
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[SW] Registration failed:", err);
        }
      }
    };

    registerServiceWorker();

    const cleanupOfflineSync = setupOfflineSync();

    return () => {
      mounted = false;
      cleanupOfflineSync();
    };
  }, []);

  return null;
}
