import { ActionMenu } from "@/components/ui/action-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SettingCategory, SettingItem } from "@/modules/settings/model";

type SettingsCatalogTabProps = {
  activeTab: "Workspace" | "Notifications" | "Security" | "Data";
  categoryTotals: Record<SettingCategory, number>;
  filteredSettings: SettingItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: (id: string) => void;
};

export function SettingsCatalogTab({ activeTab, categoryTotals, filteredSettings, query, onQueryChange, onToggle }: SettingsCatalogTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{activeTab} Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(categoryTotals) as SettingCategory[]).map((category) => (
            <div key={category} className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{category}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{categoryTotals[category]}</p>
              <p className="text-xs text-muted-foreground">active controls</p>
            </div>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search controls by label, description, or subcategory..."
          className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
        />

        <div className="overflow-x-auto rounded-2xl border border-border/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Subcategory</th>
                <th className="px-3 py-3">Control</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-muted-foreground" colSpan={5}>
                    No controls match the current search in {activeTab}.
                  </td>
                </tr>
              ) : null}
              {filteredSettings.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-b-0">
                  <td className="px-3 py-3 text-xs font-medium text-foreground">{item.category}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{item.subcategory}</td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs", item.enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{item.enabled ? "Enabled" : "Disabled"}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <ActionMenu
                      className="ml-auto"
                      items={[
                        { label: `Category: ${item.category}`, onClick: () => {} },
                        { label: `Subcategory: ${item.subcategory}`, onClick: () => {} },
                        { label: item.enabled ? "Disable" : "Enable", onClick: () => onToggle(item.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
