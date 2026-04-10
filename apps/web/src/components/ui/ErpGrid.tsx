import { cn } from "@/lib/utils";

type ErpGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function ErpGrid({ children, className }: ErpGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {children}
    </div>
  );
}
