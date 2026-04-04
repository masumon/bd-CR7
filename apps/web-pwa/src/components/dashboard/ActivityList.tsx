import { Zap } from "lucide-react";

type ActivityListProps = {
  items: string[];
};

export function ActivityList({ items }: ActivityListProps) {
  return (
    <section className="glass rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h2 className="text-[14px] font-semibold text-foreground">Activity</h2>
        <Zap className="h-3.5 w-3.5 text-primary" />
      </div>
      <ul className="divide-y divide-border/40">
        {(items.length ? items : ["No recent activity"]).slice(0, 6).map((item, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-[13px] text-foreground leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
