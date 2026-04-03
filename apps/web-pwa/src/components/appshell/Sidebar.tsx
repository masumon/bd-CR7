"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { NavItem } from "./types";

type SidebarProps = {
  items: NavItem[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ items, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? <button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={onCloseMobile} /> : null}

      <aside
        className={cn(
          "fixed bottom-14 left-0 top-14 z-50 w-64 border-r border-border bg-background transition-transform lg:bottom-0 lg:w-16 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="h-full overflow-y-auto py-2">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mx-2 mb-1 flex h-11 items-center gap-3 rounded-md px-3 text-sm",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground"
                )}
                onClick={onCloseMobile}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate lg:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
