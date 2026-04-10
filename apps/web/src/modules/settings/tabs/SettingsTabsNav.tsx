import { Card, CardContent } from "@/components/ui/card";
import { TAB_LABELS, TAB_META, type SettingsTab } from "@/modules/settings/model";

type SettingsTabsNavProps = {
  language: "en" | "bn";
  tabs: SettingsTab[];
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

export function SettingsTabsNav({ language, tabs, activeTab, onChange }: SettingsTabsNavProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-9">
          {tabs.map((tab) => {
            const { Icon, desc } = TAB_META[tab];
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onChange(tab)}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${activeTab === tab ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[11px] font-medium leading-tight">{TAB_LABELS[language][tab]}</span>
                <span className="text-[9px] leading-tight opacity-70">{desc}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
