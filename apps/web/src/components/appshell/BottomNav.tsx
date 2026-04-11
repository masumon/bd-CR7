"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { NavItem } from "./types";

type BottomNavProps = {
  /** Max 4 items shown directly; remainder accessible via "More". */
  items: NavItem[];
  /** Extra modules shown in the More drawer (not in primary 4). */
  moreItems?: NavItem[];
  onOpenMore?: () => void;
};

export function BottomNav({ items, moreItems, onOpenMore }: BottomNavProps) {
  const pathname = usePathname();

  // Show max 4 primary items + the "More" button
  const primaryItems = items.slice(0, 4);
  const hasMore = (moreItems?.length ?? 0) > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/94 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_26px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden">
      <div className={cn("grid h-[calc(64px+env(safe-area-inset-bottom))]", hasMore ? "grid-cols-5" : "grid-cols-4")}>
        {primaryItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const compactLabel = item.label.split("/")[0]?.trim() || item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 font-[var(--font-outfit)] text-[11px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-1 h-0.5 w-9 rounded-full bg-primary" />
              )}
              <span className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                active ? "bg-primary/18 text-primary shadow-[0_8px_18px_rgba(20,184,166,0.22)]" : ""
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="max-w-[4.8rem] truncate px-1 leading-none">{compactLabel}</span>
            </Link>
          );
        })}

        {hasMore && (
          <button
            type="button"
            onClick={onOpenMore}
            className="relative flex min-w-0 flex-col items-center justify-center gap-1 font-[var(--font-outfit)] text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More modules"
            title="More modules"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all">
              <MoreHorizontal className="h-5 w-5" />
            </span>
            <span className="px-1 leading-none">More</span>
          </button>
        )}
      </div>
    </nav>
  );
}
