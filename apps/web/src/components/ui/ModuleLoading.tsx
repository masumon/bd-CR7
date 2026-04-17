"use client";

import { Loader2 } from "lucide-react";

type ModuleLoadingProps = {
  /** Module name to display in Bangla (or English) */
  label: string;
};

/**
 * Lightweight per-module loading indicator shown by Next.js `loading.tsx` files
 * while a module's page chunk is being fetched.
 */
export function ModuleLoading({ label }: ModuleLoadingProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      <p className="text-sm font-medium text-foreground">
        {label} লোড হচ্ছে&hellip;
      </p>
    </div>
  );
}
