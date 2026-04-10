import { Activity, BadgeDollarSign, Wallet, Users } from "lucide-react";

type KPISectionProps = {
  funds: string;
  balance: string;
  expenses: string;
  workers: string;
};

const items = [
  { key: "funds",    label: "Budget",   icon: BadgeDollarSign, cls: "kpi-green", iconCls: "text-emerald-400" },
  { key: "balance",  label: "Balance",  icon: Wallet,          cls: "kpi-gold",  iconCls: "text-yellow-400" },
  { key: "expenses", label: "Expenses", icon: Activity,        cls: "kpi-red",   iconCls: "text-rose-400" },
  { key: "workers",  label: "Workers",  icon: Users,           cls: "kpi-blue",  iconCls: "text-blue-400" },
] as const;

export function KPISection({ funds, balance, expenses, workers }: KPISectionProps) {
  const map = { funds, balance, expenses, workers };

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className={`glass rounded-2xl border p-3 ${item.cls}`}>
            <div className="flex items-start justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">{item.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-xl bg-background/50 ${item.iconCls}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 font-display text-[16px] font-semibold text-foreground">{map[item.key]}</p>
          </div>
        );
      })}
    </section>
  );
}
