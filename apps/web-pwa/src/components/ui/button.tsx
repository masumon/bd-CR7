import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary)/0.84))] text-primary-foreground shadow-[0_14px_30px_rgba(12,86,73,0.24)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(12,86,73,0.28)]",
    ghost: "bg-transparent text-foreground hover:bg-muted/75 hover:text-foreground",
    outline: "border border-border/80 bg-card/88 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:border-primary/30 hover:bg-muted/68",
  };

  return (
    <button
      className={cn("inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium tracking-[0.01em] transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-60", variants[variant], className)}
      {...props}
    />
  );
}
