import { cn } from "@/lib/utils";

type ErpLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export function ErpLayout({ children, className }: ErpLayoutProps) {
  return (
    <div className={cn("safe-top safe-bottom safe-x flex min-h-dvh flex-col space-y-4 p-4", className)}>
      {children}
    </div>
  );
}
