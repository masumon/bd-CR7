"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// EmptyState — unified zero-data placeholder
// ═══════════════════════════════════════════════════════════

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state", className)} role="status" aria-live="polite">
      <div className="empty-state-icon">
        <Icon className="h-6 w-6" />
      </div>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ErrorCard — consistent error display with optional retry
// ═══════════════════════════════════════════════════════════

type ErrorCardProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorCard({ message, onRetry, retryLabel = "Retry", className }: ErrorCardProps) {
  return (
    <div className={cn("error-card", className)} role="alert" aria-live="assertive">
      <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-300 transition-colors hover:text-rose-200"
          >
            <RefreshCw className="h-3 w-3" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ContentSkeleton — shimmer loading placeholders
// ═══════════════════════════════════════════════════════════

type SkeletonRowProps = {
  /** Show an icon placeholder on the left */
  withIcon?: boolean;
  /** Show a narrow trailing value on the right */
  withValue?: boolean;
};

function SkeletonRow({ withIcon, withValue }: SkeletonRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2.5">
      {withIcon && <div className="skeleton h-9 w-9 flex-shrink-0 rounded-xl" />}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="skeleton h-3.5 w-3/5 rounded-md" />
        <div className="skeleton h-2.5 w-2/5 rounded-md" />
      </div>
      {withValue && <div className="skeleton h-4 w-12 flex-shrink-0 rounded-md" />}
    </div>
  );
}

type ContentSkeletonProps = {
  rows?: number;
  withIcon?: boolean;
  withValue?: boolean;
  /** Render as a 2-col card grid instead of rows */
  asGrid?: boolean;
  className?: string;
};

export function ContentSkeleton({
  rows = 4,
  withIcon = true,
  withValue = false,
  asGrid = false,
  className,
}: ContentSkeletonProps) {
  const items = Array.from({ length: rows });

  if (asGrid) {
    return (
      <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
        {items.map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {items.map((_, i) => (
        <SkeletonRow key={i} withIcon={withIcon} withValue={withValue} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// StatCardSkeleton — for KPI / stat card placeholders
// ═══════════════════════════════════════════════════════════

export function StatCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="erp-card p-3 space-y-2">
          <div className="skeleton h-2.5 w-3/5 rounded-md" />
          <div className="skeleton h-5 w-4/5 rounded-md" />
        </div>
      ))}
    </div>
  );
}
