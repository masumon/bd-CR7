import Link from "next/link";
import { LucideIcon } from "lucide-react";

type ModuleItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type ModuleGridProps = {
  items: ModuleItem[];
};

export function ModuleGrid({ items }: ModuleGridProps) {
  return (
    <section className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex h-20 flex-col items-center justify-center rounded-md border border-border bg-card text-center active:scale-[0.98]"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="mt-1 line-clamp-1 px-1 text-[11px] font-medium text-foreground">{item.label}</span>
          </Link>
        );
      })}
    </section>
  );
}
