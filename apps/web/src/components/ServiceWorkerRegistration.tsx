"use client";

import { useEffect } from "react";

import { setupOfflineSync } from "@/lib/offlineSync";

const CACHE_VERSION = "bdcr7-v2026-04-16";
const SW_RESET_KEY = `bdcr7-sw-reset-${CACHE_VERSION}`;
const PAGE_CACHE_NAME = `${CACHE_VERSION}-others`;
const START_URL_CACHE_NAME = `${CACHE_VERSION}-start-url`;
const ACTIVE_CACHE_NAMES = new Set([PAGE_CACHE_NAME, START_URL_CACHE_NAME]);

async function cacheCurrentRoute(pathname: string, search: string) {
  if (typeof window === "undefined" || !("caches" in window) || !window.navigator.onLine) {
    return;
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/auth") || pathname.startsWith("/login")) {
    return;
  }

  const requestUrl = `${window.location.origin}${pathname}${search}`;
  const cacheName = pathname === "/" ? START_URL_CACHE_NAME : PAGE_CACHE_NAME;

  try {
    const response = await fetch(requestUrl, {
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "x-bdcr7-cache-warm": "1",
      },
    });

    if (!response.ok) {
      return;
    }

    const normalized = response.redirected
      ? new Response(response.body, {
          status: 200,
          statusText: "OK",
          headers: response.headers,
        })
      : response.clone();

    const cache = await caches.open(cacheName);
    await cache.put(requestUrl, normalized);
  } catch {
    // Best-effort route warming only.
  }
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    let mounted = true;

    const registerServiceWorker = async () => {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        return;
      }

      try {
        // One-time reset to remove stale workers/caches from older versions.
        if (window.localStorage.getItem(SW_RESET_KEY) !== "done") {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));

          if ("caches" in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(
              cacheKeys
                .filter((key) => !ACTIVE_CACHE_NAMES.has(key))
                .map((key) => caches.delete(key))
            );
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
              if (process.env.NODE_ENV !== "production") {
                console.warn("[SW] Background sync registration failed:", err);
              }
            });
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warmCurrentRoute = () => {
      void cacheCurrentRoute(window.location.pathname || "/", window.location.search || "");
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function pushState(...args) {
      originalPushState(...args);
      warmCurrentRoute();
    };

    window.history.replaceState = function replaceState(...args) {
      originalReplaceState(...args);
      warmCurrentRoute();
    };

    window.addEventListener("popstate", warmCurrentRoute);
    window.addEventListener("online", warmCurrentRoute);
    warmCurrentRoute();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", warmCurrentRoute);
      window.removeEventListener("online", warmCurrentRoute);
    };
  }, []);

  return null;
}
