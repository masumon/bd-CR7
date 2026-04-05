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
    <div
      className="relative min-h-[100dvh] w-full overflow-x-hidden"
      style={{ fontFamily: "var(--font-outfit-var, var(--font-body), sans-serif)" }}
    >
      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
