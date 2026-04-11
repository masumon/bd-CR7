import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ErpHeaderProps = {
  title: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
};

export function ErpHeader({ title, icon: Icon, children, className }: ErpHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-erp-accent/15 sm:h-9 sm:w-9">
            <Icon className="h-4 w-4 text-erp-accent" />
          </span>
        )}
        <h1 className="text-base font-medium text-erp-text-primary sm:text-lg">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
