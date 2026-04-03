type ActivityListProps = {
  items: string[];
};

export function ActivityList({ items }: ActivityListProps) {
  return (
    <section className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Activity</h2>
      </div>
      <ul className="divide-y divide-border">
        {(items.length ? items : ["No activity"]).slice(0, 6).map((item) => (
          <li key={item} className="px-3 py-2 text-xs text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
