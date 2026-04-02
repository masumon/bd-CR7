"use client";

import { cn } from "@/lib/utils";

type TabsProps = {
  tabs: string[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-card p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition",
            value === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
