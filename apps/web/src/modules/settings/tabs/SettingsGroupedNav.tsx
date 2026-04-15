"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { TAB_LABELS, TAB_META, type SettingsTab } from "@/modules/settings/model";

type SettingsGroupedNavProps = {
  language: "en" | "bn";
  tabs: SettingsTab[];
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

// Grouped IA: Account / Workspace / System
type Group = { key: string; en: string; bn: string; tabs: SettingsTab[] };

const SETTINGS_GROUPS: Group[] = [
  {
    key: "account",
    en: "Account",
    bn: "অ্যাকাউন্ট",
    tabs: ["Profile", "Users"],
  },
  {
    key: "workspace",
    en: "Workspace",
    bn: "ওয়ার্কস্পেস",
    tabs: ["Workspace", "Notifications"],
  },
  {
    key: "system",
    en: "System",
    bn: "সিস্টেম",
    tabs: ["Security", "Data", "Integrations", "Sync", "Backup", "Advanced"],
  },
];

export function SettingsGroupedNav({ language, tabs, activeTab, onChange }: SettingsGroupedNavProps) {
  // Determine which group contains the active tab — keep it open by default
  const defaultOpen = SETTINGS_GROUPS.find((g) =>
    g.tabs.some((t) => t === activeTab)
  )?.key ?? "account";

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set([defaultOpen]));

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {SETTINGS_GROUPS.map((group) => {
        const visibleTabs = group.tabs.filter((t) => tabs.includes(t));
        if (visibleTabs.length === 0) return null;

        const isOpen    = openGroups.has(group.key);
        const groupLabel = language === "bn" ? group.bn : group.en;
        const hasActive  = visibleTabs.includes(activeTab);

        return (
          <div key={group.key} className="settings-section">
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className={cn(
                "settings-section-header w-full",
                hasActive && "border-l-2 border-l-primary",
              )}
              aria-expanded={isOpen ? "true" : "false"}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-semibold",
                  hasActive ? "text-primary" : "text-foreground",
                )}>
                  {groupLabel}
                </span>
                {hasActive && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {TAB_LABELS[language][activeTab]}
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
              }
            </button>

            {/* Section body */}
            {isOpen && (
              <div className="settings-section-body space-y-1">
                {visibleTabs.map((tab) => {
                  const { Icon, desc } = TAB_META[tab];
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => onChange(tab)}
                      className={cn(
                        "settings-row w-full text-left",
                        isActive && "bg-primary/10",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                          isActive ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground",
                        )}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-medium leading-tight",
                            isActive ? "text-primary" : "text-foreground",
                          )}>
                            {TAB_LABELS[language][tab]}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-tight truncate">{desc}</p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
