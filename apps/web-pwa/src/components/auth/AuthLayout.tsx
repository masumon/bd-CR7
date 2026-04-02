"use client";

import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
  maxWidth?: "sm" | "md" | "lg";
  variant?: "welcome" | "form";
  className?: string;
}

/**
 * Responsive auth layout container
 * Handles:
 * - Safe-area padding for notches/gesture bars
 * - 100dvh viewport fitting
 * - Proper flex layout for centering
 * - Responsive spacing and sizing
 * - PWA install mode support
 */
export function AuthLayout({
  children,
  maxWidth = "sm",
  variant = "form",
  className = "",
}: AuthLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      className={`
        /* Fit-to-screen with safe areas */
        min-h-[100dvh]
        w-full
        overflow-x-hidden
        
        /* Safe area support */
        pt-[max(1rem,env(safe-area-inset-top))]
        pb-[max(1rem,env(safe-area-inset-bottom))]
        pl-[max(1rem,env(safe-area-inset-left))]
        pr-[max(1rem,env(safe-area-inset-right))]
        
        /* Layout */
        flex flex-col
        ${variant === "welcome" ? "justify-between" : "justify-center"}
        items-center
        
        /* Responsive padding */
        px-4 sm:px-6 md:px-8
        py-6 sm:py-8 md:py-12
        
        /* Animation */
        animate-fade-in
        
        ${className}
      `}
    >
      {/* Header spacer for welcome variant */}
      {variant === "welcome" && <div className="h-4 sm:h-6" />}

      {/* Main content - responsive width */}
      <div
        className={`
          w-full
          ${maxWidthClasses[maxWidth]}
          flex flex-col
          gap-6 sm:gap-8
          animate-slide-up
        `}
      >
        {children}
      </div>

      {/* Footer spacer for welcome variant */}
      {variant === "welcome" && <div className="h-4 sm:h-6" />}
    </div>
  );
}

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Glassmorphic auth card container
 * Maintains consistent styling across all auth pages
 */
export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`
        /* Glass effect */
        bg-white/[0.92]
        backdrop-blur-lg
        -webkit-backdrop-filter: blur(18px)
        border border-white/30
        
        /* Shape */
        rounded-3xl
        
        /* Responsive padding */
        px-5 sm:px-6 md:px-8
        py-6 sm:py-7 md:py-8
        
        /* Shadow */
        shadow-lg md:shadow-xl
        
        /* Transitions */
        transition-all duration-300
        
        /* Hover state */
        hover:shadow-2xl
        motion-safe:hover:-translate-y-0.5
        
        /* Active state */
        active:scale-[0.99]
        
        ${className}
      `}
    >
      {children}
    </div>
  );
}
