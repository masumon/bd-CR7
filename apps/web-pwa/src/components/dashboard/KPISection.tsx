import { Activity, BadgeDollarSign, Wallet, Users } from "lucide-react";

type KPISectionProps = {
  funds: string;
  balance: string;
  expenses: string;
  workers: string;
};

const items = [
  { key: "funds", label: "Funds", icon: BadgeDollarSign },
  { key: "balance", label: "Balance", icon: Wallet },
  { key: "expenses", label: "Expenses", icon: Activity },
  { key: "workers", label: "Workers", icon: Users },
] as const;

export function KPISection({ funds, balance, expenses, workers }: KPISectionProps) {
  const map = { funds, balance, expenses, workers };

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="rounded-md border border-border bg-card px-2 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{map[item.key]}</p>
          </div>
        );
      })}
    </section>
  );
}
