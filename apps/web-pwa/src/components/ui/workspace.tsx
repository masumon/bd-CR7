import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkspaceHeroProps = {
  badge: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string }>;
  highlights?: Array<{ title: string; description: string; icon: LucideIcon }>;
  className?: string;
};

export function WorkspaceHero({ badge, title, description, stats, highlights = [], className }: WorkspaceHeroProps) {
  return (
    <Card className={cn("overflow-hidden border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,235,0.88),rgba(15,108,90,0.06))] dark:bg-[linear-gradient(135deg,rgba(13,28,24,0.96),rgba(11,24,21,0.92),rgba(245,158,11,0.08))]", className)}>
      <CardContent className="grid gap-5 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {badge}
          </div>
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {highlights.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map(({ title: itemTitle, description: itemDescription, icon: Icon }) => (
                <div key={itemTitle} className="rounded-[1.35rem] border border-border/70 bg-background/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="font-semibold text-foreground">{itemTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{itemDescription}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="soft-grid rounded-[1.6rem] border border-border/70 bg-background/82 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Workspace Snapshot</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[1.2rem] border border-border/70 bg-muted/25 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/78">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}