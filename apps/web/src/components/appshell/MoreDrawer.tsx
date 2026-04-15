"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Pin, PinOff, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { NavItem } from "./types";

const RECENTS_KEY = "bdcr7-nav-recents";
const PINS_KEY    = "bdcr7-nav-pins";
const MAX_RECENTS = 4;

function loadList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[]; }
  catch { return []; }
}

function saveList(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
}

type MoreDrawerProps = {
  open: boolean;
  items: NavItem[];
  onClose: () => void;
  language?: "en" | "bn";
};

export function MoreDrawer({ open, items, onClose, language = "en" }: MoreDrawerProps) {
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [pins, setPins] = useState<string[]>([]);

  // Load from localStorage once on mount
  useEffect(() => {
    setRecents(loadList(RECENTS_KEY));
    setPins(loadList(PINS_KEY));
  }, []);

  // Clear search on close
  useEffect(() => {
    if (!open && query) setQuery("");
  }, [open, query]);

  // Keyboard close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const trackVisit = useCallback((href: string) => {
    setRecents((prev) => {
      const next = [href, ...prev.filter((h) => h !== href)].slice(0, MAX_RECENTS);
      saveList(RECENTS_KEY, next);
      return next;
    });
  }, []);

  const togglePin = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPins((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      saveList(PINS_KEY, next);
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? items.filter((item) => item.label.toLowerCase().includes(normalized))
      : items;

    // Pinned items float to top
    const pinned   = filtered.filter((item) => pins.includes(item.href));
    const unpinned = filtered.filter((item) => !pins.includes(item.href));
    return [...pinned, ...unpinned];
  }, [items, query, pins]);

  const recentItems = useMemo(
    () => recents.map((href) => items.find((i) => i.href === href)).filter(Boolean) as NavItem[],
    [recents, items],
  );

  const labels = {
    title:   language === "bn" ? "আরো মডিউল"       : "More Modules",
    search:  language === "bn" ? "মডিউল খুঁজুন..."  : "Search module…",
    recents: language === "bn" ? "সম্প্রতি ব্যবহৃত" : "Recently visited",
    pinned:  language === "bn" ? "পিন করা"           : "Pinned",
    empty:   language === "bn" ? "কোনো মডিউল পাওয়া যায়নি।" : "No module found.",
  };

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
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-background/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border/70" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <p className="text-sm font-semibold text-foreground">{labels.title}</p>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition",
                  "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                )}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.search}
                className="h-9 w-full rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>

            {/* Recently visited (only when not searching) */}
            {!query && recentItems.length > 0 && (
              <div className="px-4 pb-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {labels.recents}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {recentItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => { trackVisit(item.href); onClose(); }}
                        className="flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-border/50 bg-card/60 px-3 py-2.5 transition-all hover:bg-card active:scale-95"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[10px] font-medium text-foreground">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Module grid with pin support */}
            <div className="grid grid-cols-3 gap-3 px-4 pb-6">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isPinned = pins.includes(item.href);
                return (
                  <div key={item.href} className="relative">
                    <Link
                      href={item.href}
                      onClick={() => { trackVisit(item.href); onClose(); }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-all hover:bg-card active:scale-95",
                        isPinned
                          ? "border-primary/35 bg-primary/06"
                          : "border-border/50 bg-card/60",
                      )}
                    >
                      <span className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isPinned ? "bg-primary/18 text-primary" : "bg-primary/12 text-primary",
                      )}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-medium text-foreground leading-tight line-clamp-2">
                        {item.label}
                      </span>
                      {isPinned && (
                        <span className="absolute top-1.5 right-1.5">
                          <Pin className="h-3 w-3 text-primary opacity-70" />
                        </span>
                      )}
                    </Link>
                    {/* Long-press style toggle — tap the corner button */}
                    <button
                      type="button"
                      onClick={(e) => togglePin(item.href, e)}
                      className={cn(
                        "absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                        isPinned
                          ? "border-primary/50 bg-primary/15 text-primary"
                          : "border-border/60 bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100",
                        "focus-visible:opacity-100 hover:opacity-100",
                      )}
                      aria-label={isPinned ? "Unpin module" : "Pin module"}
                      title={isPinned ? "Unpin" : "Pin to top"}
                    >
                      {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="col-span-3 rounded-2xl border border-dashed border-border/70 bg-card/50 px-3 py-8 text-center text-xs text-muted-foreground">
                  {labels.empty}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
