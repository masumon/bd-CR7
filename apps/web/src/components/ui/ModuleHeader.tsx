import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
};

export function ModuleHeader({ icon: Icon, title, subtitle, className, children }: ModuleHeaderProps) {
  return (
    <div className={cn("glass rounded-2xl px-4 py-4 mb-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="font-display text-[20px] font-bold text-foreground leading-tight">{title}</h1>
            {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
