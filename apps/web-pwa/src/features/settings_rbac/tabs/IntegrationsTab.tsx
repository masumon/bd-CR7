import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INTEGRATION_CATALOG, type IntegrationState } from "@/features/settings_rbac/model";

type IntegrationsTabProps = {
  integrationState: IntegrationState;
  onToggle: (key: keyof IntegrationState) => void;
};

export function IntegrationsTab({ integrationState, onToggle }: IntegrationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {INTEGRATION_CATALOG.map((integration) => (
          <div key={integration.key} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{integration.label}</p>
              <p className="text-xs text-muted-foreground">{integration.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggle(integration.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                integrationState[integration.key]
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {integrationState[integration.key] ? "Enabled" : "Disabled"}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
