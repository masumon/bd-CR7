"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

import { cn } from "@/lib/utils";

type ActionItem = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
};

type ActionMenuProps = {
  label?: string;
  items: ActionItem[];
  className?: string;
};

export function ActionMenu({ label = "Open actions", items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/75 bg-background/90 text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/65 hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-40 rounded-2xl border border-border/80 bg-card/96 p-1.5 shadow-[0_20px_50px_rgba(12,36,31,0.16)] backdrop-blur-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
                item.tone === "danger"
                  ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25"
                  : "text-foreground hover:bg-muted/75"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}