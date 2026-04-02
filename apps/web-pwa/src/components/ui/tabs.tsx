"use client";

import { cn } from "@/lib/utils";

type TabsProps = {
  tabs: string[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex w-full flex-wrap rounded-xl border border-border bg-card/90 p-1 sm:w-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none",
            value === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
