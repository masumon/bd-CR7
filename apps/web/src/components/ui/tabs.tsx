"use client";

import { cn } from "@/lib/utils";

type TabsProps = {
  tabs: string[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="app-pill-group inline-flex w-full flex-wrap sm:w-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          aria-pressed={value === tab}
          className={cn(
            "app-pill flex-1 sm:flex-none",
            value === tab
              ? "app-pill-active shadow-[0_10px_20px_rgba(13,148,136,0.28)]"
              : ""
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
