import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-primary text-primary-foreground shadow-[0_16px_36px_rgba(15,108,90,0.22)] hover:opacity-95",
    ghost: "bg-transparent text-foreground hover:bg-muted/80",
    outline: "border border-border bg-card/90 hover:bg-muted/70",
  };

  return (
    <button
      className={cn("inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-60", variants[variant], className)}
      {...props}
    />
  );
}
