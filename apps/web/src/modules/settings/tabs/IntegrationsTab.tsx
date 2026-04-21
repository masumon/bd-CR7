import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INTEGRATION_CATALOG, type IntegrationState } from "@/modules/settings/model";

type IntegrationHealthStatus = "ok" | "missing" | "unknown";

type IntegrationsTabProps = {
  integrationState: IntegrationState;
  integrationHealth?: Partial<Record<keyof IntegrationState, IntegrationHealthStatus>>;
  language?: "en" | "bn";
  onToggle: (key: keyof IntegrationState) => void;
};

function healthBadge(
  status: IntegrationHealthStatus | undefined,
  language: "en" | "bn"
): { text: string; className: string } {
  if (status === "ok") {
    return {
      text: language === "bn" ? "কনফিগারড" : "Configured",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  }
  if (status === "missing") {
    return {
      text: language === "bn" ? "মিসিং" : "Missing",
      className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    };
  }
  return {
    text: language === "bn" ? "যাচাই হয়নি" : "Unchecked",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };
}

export function IntegrationsTab({
  integrationState,
  integrationHealth = {},
  language = "en",
  onToggle,
}: IntegrationsTabProps) {
  const getHealthMeta = (key: keyof IntegrationState) => healthBadge(integrationHealth[key], language);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {language === "bn" ? "ইন্টিগ্রেশন" : "Integrations"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {INTEGRATION_CATALOG.map((integration) => (
          <div key={integration.key} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{integration.label}</p>
              <p className="text-xs text-muted-foreground">{integration.description}</p>
              <span
                className={cn(
                  "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  getHealthMeta(integration.key).className
                )}
              >
                {getHealthMeta(integration.key).text}
              </span>
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
              {integrationState[integration.key]
                ? language === "bn" ? "সক্রিয়" : "Enabled"
                : language === "bn" ? "বন্ধ" : "Disabled"}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
