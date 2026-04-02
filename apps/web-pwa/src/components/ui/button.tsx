import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "bg-transparent text-foreground hover:bg-muted",
    outline: "border border-border bg-card hover:bg-muted",
  };

  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95", variants[variant], className)}
      {...props}
    />
  );
}
