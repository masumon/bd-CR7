import { ArrowRightLeft, Calculator, ClipboardList, ShipWheel, Truck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white/85 via-white/80 to-primary/5 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-primary/10">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Import & Supply Workspace
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Separate shipment flow, costing, and customs actions into clear subcategories.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                The import module now presents L/C monitoring, landed-cost visibility, inbound logistics, and customs tasks as distinct lanes instead of a placeholder block.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { title: "L/C Tracker", icon: ClipboardList },
                { title: "Costing", icon: Calculator },
                { title: "Shipment", icon: ShipWheel },
                { title: "Inbound", icon: Truck },
              ].map(({ title, icon: Icon }) => (
                <div key={title} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Action Queue</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">2 shipments require customs document validation.</div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">1 landed-cost update is pending duty and freight reconciliation.</div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">Next UI step should connect these lanes to real import records and supplier events.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            title: "L/C Stage Board",
            lines: ["Open request", "Bank processing", "Supplier confirmation", "Document collection"],
          },
          {
            title: "Landed Cost Blocks",
            lines: ["Base invoice value", "Freight and insurance", "Duty and clearance", "Per-unit allocation"],
          },
          {
            title: "Supply Handoff",
            lines: ["Port release queue", "Warehouse arrival", "Outlet distribution", "Risk exceptions"],
          },
        ].map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {section.lines.map((line) => (
                <div key={line} className="rounded-2xl border border-border bg-background p-4">
                  {line}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
