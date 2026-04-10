"use client";

import { cn } from "@/lib/utils";

type TabsProps = {
  tabs: string[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex w-full flex-wrap rounded-2xl border border-border/70 bg-card/90 p-1.5 sm:w-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          aria-pressed={value === tab}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition sm:flex-none",
            value === tab
              ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(13,148,136,0.28)]"
              : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
