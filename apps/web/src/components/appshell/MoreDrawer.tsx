"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { NavItem } from "./types";

type MoreDrawerProps = {
  open: boolean;
  items: NavItem[];
  onClose: () => void;
};

export function MoreDrawer({ open, items, onClose }: MoreDrawerProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open && query) {
      setQuery("");
    }
  }, [open, query]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [items, query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="more-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
            type="button"
          />
          <motion.aside
            key="more-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-border/60 bg-background/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="More modules"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border/70" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <p className="text-sm font-semibold text-foreground">More / আরো মডিউল</p>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition",
                  "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search module..."
                className="h-9 w-full rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-3 gap-3 px-4 pb-6">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-2 py-4 text-center transition-all hover:bg-card active:scale-95"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-medium text-foreground leading-tight line-clamp-2">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              {filteredItems.length === 0 ? (
                <div className="col-span-3 rounded-2xl border border-dashed border-border/70 bg-card/50 px-3 py-8 text-center text-xs text-muted-foreground">
                  No module found for this search.
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
