"use client";

/**
 * Global branding footer shown on auth pages.
 * Keeps the public auth surface branded without exposing personal contact links.
 */
export function PoweredByFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`w-full pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className}`}
    >
      <div className="h-px w-full bg-white/[0.08]" />
      <div className="pt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <p className="whitespace-nowrap text-[10px] tracking-[0.15em] text-white/30">
          Powered by{" "}
          <span className="gold-text-gradient font-semibold uppercase tracking-[0.18em]">
            SUMONIX AI
          </span>
        </p>
        <p className="text-[10px] tracking-[0.12em] text-white/25">
          Secure access experience for BD CR7 ERP
        </p>
      </div>
    </footer>
  );
}
