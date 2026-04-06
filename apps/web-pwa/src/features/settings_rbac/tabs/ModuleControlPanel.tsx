"use client";

import { Layers } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useModuleStore } from "@/store/moduleStore";

export function ModuleControlPanel({ language }: { language: "en" | "bn" }) {
  const modules = useModuleStore((s) => s.modules);
  const toggleModule = useModuleStore((s) => s.toggleModule);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          {language === "bn" ? "মডিউল কন্ট্রোল" : "Module Control"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {language === "bn"
            ? "ডায়নামিক মডিউল চালু বা বন্ধ করুন। বন্ধ মডিউল নেভিগেশন থেকে লুকিয়ে যাবে।"
            : "Toggle dynamic modules on or off. Disabled modules are hidden from navigation automatically."}
        </p>
        {modules.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{language === "bn" ? m.labelBn : m.labelEn}</p>
              <p className="text-xs text-muted-foreground">{language === "bn" ? m.descriptionBn : m.descriptionEn}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleModule(m.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                m.enabled
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {m.enabled ? (language === "bn" ? "চালু" : "ON") : (language === "bn" ? "বন্ধ" : "OFF")}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
