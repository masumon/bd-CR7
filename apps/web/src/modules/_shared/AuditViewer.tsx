"use client";

import { Clock3 } from "lucide-react";

export interface AuditItem {
  id: string;
  action: string;
  actor?: string | null;
  timestamp: string;
  summary?: string | null;
}

export function AuditViewer({ items }: { items: AuditItem[] }) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No audit entries found.</p> : null}

      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border/70 bg-card/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">{item.action}</p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">By: {item.actor || "system"}</p>
          {item.summary ? <p className="mt-2 text-sm text-foreground">{item.summary}</p> : null}
        </div>
      ))}
    </div>
  );
}
