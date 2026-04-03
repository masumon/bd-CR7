"use client";

import { useEffect } from "react";

import { setupOfflineSync } from "@/lib/offlineSync";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const cleanupOfflineSync = setupOfflineSync();

    return () => {
      cleanupOfflineSync();
    };
  }, []);

  return null;
}