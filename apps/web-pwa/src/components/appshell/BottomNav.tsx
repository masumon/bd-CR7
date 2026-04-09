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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className={cn("grid h-14", hasMore ? "grid-cols-5" : "grid-cols-4")}>
        {primaryItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-1 h-0.5 w-7 rounded-full bg-primary" />
              )}
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                active ? "bg-primary/18 text-primary shadow-[0_8px_18px_rgba(20,184,166,0.22)]" : ""
              )}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="max-w-[4.6rem] truncate px-1">{item.label}</span>
            </Link>
          );
        })}

        {hasMore && (
          <button
            onClick={onOpenMore}
            className="relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More modules"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </span>
            <span className="px-1">More</span>
          </button>
        )}
      </div>
    </nav>
  );
}
