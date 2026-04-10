"use client";

import { DEVELOPER_CONFIG } from "@/lib/developers";
import { Mail } from "lucide-react";

interface DeveloperCreditProps {
  variant?: "full" | "compact";
  className?: string;
}

export function DeveloperCredit({ 
  variant = "full",
  className = "" 
}: DeveloperCreditProps) {
  if (variant === "compact") {
    return (
      <div className={`text-center space-y-1 ${className}`}>
        <p className="text-xs font-medium text-foreground/80">
          {DEVELOPER_CONFIG.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {DEVELOPER_CONFIG.role}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Developer Name & Role */}
      <div className="text-center">
        <h4 className="text-sm font-semibold text-foreground">
          {DEVELOPER_CONFIG.name}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {DEVELOPER_CONFIG.role}
        </p>
      </div>

      {/* Power Line */}
      <p className="text-xs text-center text-muted-foreground/70 italic">
        {DEVELOPER_CONFIG.powerLine}
      </p>

      {/* Email Contact */}
      <a
        href={`mailto:${DEVELOPER_CONFIG.email}`}
        className="
          inline-flex items-center justify-center gap-2
          text-xs font-medium
          text-primary hover:text-primary/80
          transition-colors
          w-full
        "
        title="Email the developer"
      >
        <Mail className="w-3.5 h-3.5" />
        {DEVELOPER_CONFIG.email}
      </a>
    </div>
  );
}
