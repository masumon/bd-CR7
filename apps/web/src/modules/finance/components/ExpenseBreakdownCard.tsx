// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getWidthClass(widthPct: number) {
  if (widthPct >= 100) return "w-full";
  if (widthPct >= 90) return "w-11/12";
  if (widthPct >= 80) return "w-10/12";
  if (widthPct >= 70) return "w-9/12";
  if (widthPct >= 60) return "w-8/12";
  if (widthPct >= 50) return "w-6/12";
  if (widthPct >= 40) return "w-5/12";
  if (widthPct >= 30) return "w-4/12";
  if (widthPct >= 20) return "w-3/12";
  if (widthPct >= 10) return "w-2/12";
  if (widthPct > 0) return "w-1/12";
  return "w-0";
}

export function ExpenseBreakdownCard({
  loading,
  categoryBreakdown,
  subcategoryBreakdown,
}: {
  loading: boolean;
  categoryBreakdown: Array<{ label: string; value: number; widthPct: number }>;
  subcategoryBreakdown: Array<{ label: string; value: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(loading ? [] : categoryBreakdown).map((item) => (
          <div key={item.label} className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">৳{item.value.toLocaleString("en-BD")}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className={`h-2 rounded-full bg-primary transition-all duration-500 ${getWidthClass(item.widthPct)}`} />
            </div>
          </div>
        ))}
        {!loading && categoryBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">No category data yet.</div>
        ) : null}

        <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Top Subcategories</p>
          <div className="mt-3 space-y-2">
            {subcategoryBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{item.label}</span>
                <span className="text-muted-foreground">৳{item.value.toLocaleString("en-BD")}</span>
              </div>
            ))}
            {!subcategoryBreakdown.length ? <p className="text-sm text-muted-foreground">No subcategory data yet.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          Use the expense form to keep category and receipt data complete before the checker review stage.
        </div>
      </CardContent>
    </Card>
  );
}
