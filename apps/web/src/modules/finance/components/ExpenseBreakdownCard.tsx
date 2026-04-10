// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground">৳{item.value.toLocaleString("en-BD")}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${item.widthPct}%` }} />
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
