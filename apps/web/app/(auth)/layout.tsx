"use client";

import React from "react";

/**
 * Auth Layout Wrapper
 * Provides consistent styling for all auth pages
 * - BD CR7 animated background (dark mode default)
 * - Safe area support
 * - PWA fit-to-screen
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-[var(--font-outfit-var)] relative min-h-[100dvh] w-full overflow-x-hidden">
      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
