"use client";

import React from "react";

/**
 * Auth Layout Wrapper
 * Provides consistent styling for all auth pages
 * - Background gradients (light/dark mode aware)
 * - Safe area support
 * - PWA fit-to-screen
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      {/* Light mode background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 auth-bg-light dark:hidden" />

      {/* Dark mode background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 hidden dark:block auth-bg-dark" />

      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
