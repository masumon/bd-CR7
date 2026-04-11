import { cn } from "@/lib/utils";

type ErpGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function ErpGrid({ children, className }: ErpGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3", className)}>
      {children}
    </div>
  );
}
