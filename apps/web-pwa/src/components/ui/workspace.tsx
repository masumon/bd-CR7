import { cn } from "@/lib/utils";

type WorkspaceHeroProps = {
  badge: string;
  stats: Array<{ label: string; value: string }>;
  className?: string;
};

const STAT_COLORS = [
  { border: "border-amber-500/25", bg: "bg-amber-500/10", text: "text-amber-400" },
  { border: "border-emerald-500/25", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  { border: "border-sky-500/25", bg: "bg-sky-500/10", text: "text-sky-400" },
  { border: "border-rose-500/25", bg: "bg-rose-500/10", text: "text-rose-400" },
];

export function WorkspaceHero({ badge, stats, className }: WorkspaceHeroProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        {badge}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((item, i) => {
          const c = STAT_COLORS[i % STAT_COLORS.length];
          return (
            <div key={item.label} className={cn("glass min-w-0 rounded-2xl border p-3 shadow-[0_10px_24px_rgba(0,0,0,0.15)] sm:p-4", c.border)}>
              <div className="flex items-center justify-between gap-1">
                <p className="min-w-0 truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">{item.label}</p>
                <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border sm:h-6 sm:w-6", c.border, c.bg)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2", c.text, c.bg)} />
                </span>
              </div>
              <p className={cn("mt-1 truncate text-xl font-bold sm:mt-1.5 sm:text-2xl", c.text)}>{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p>
        <h3 className="mt-0.5 text-[17px] font-semibold text-foreground">{title}</h3>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}