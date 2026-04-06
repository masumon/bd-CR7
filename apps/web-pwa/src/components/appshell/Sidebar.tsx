"use client";

import Link from "next/link";
import Image from "next/image";
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
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed bottom-14 left-0 top-14 z-50 border-r border-border/60 bg-background/94 backdrop-blur-xl transition-transform duration-300 ease-in-out",
          "w-64 lg:bottom-0 lg:w-16 lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <nav className="h-full overflow-y-auto py-2">
          {/* Logo mark — visible on desktop icon-only sidebar */}
          <div className="hidden lg:flex items-center justify-center py-2 mb-1">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-sm">
              <Image src="/icons/icon.svg" alt="SUMONIX Logo" width={36} height={36} className="h-9 w-9 object-contain" />
            </div>
          </div>
          <p className="section-label px-3 pb-2 pt-1 lg:hidden">Core Navigation</p>
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "group mx-2 mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/16 text-primary shadow-[0_8px_18px_rgba(16,185,129,0.18)]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                onClick={onCloseMobile}
              >
                <span className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-primary/20 text-primary" : "group-hover:bg-muted"
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate lg:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
