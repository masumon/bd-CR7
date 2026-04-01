"use client";

import { useEffect } from "react";

import { setupOfflineSync } from "@/lib/offlineSync";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Keep registration failures non-fatal for the shell.
      });
    };

    window.addEventListener("load", register, { once: true });
    const cleanupOfflineSync = setupOfflineSync();

    return () => {
      window.removeEventListener("load", register);
      cleanupOfflineSync();
    };
  }, []);

  return null;
}