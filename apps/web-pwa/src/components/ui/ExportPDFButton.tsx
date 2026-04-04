"use client";

import { Download, FileText } from "lucide-react";
import { exportToPDF, type ExportPDFOptions } from "@/lib/exportPDF";
import { cn } from "@/lib/utils";

type ExportPDFButtonProps = {
  /** Called at click-time to build the export options from current component state */
  onBuildOptions: () => ExportPDFOptions;
  language?: "en" | "bn";
  variant?: "primary" | "outline" | "ghost";
  className?: string;
};

export function ExportPDFButton({
  onBuildOptions,
  language = "en",
  variant = "outline",
  className,
}: ExportPDFButtonProps) {
  const label =
    language === "bn" ? "PDF এক্সপোর্ট" : "Export PDF";
  const sublabel =
    language === "bn" ? "A4 রিপোর্ট" : "A4 Report";

  const handleExport = () => exportToPDF(onBuildOptions());

  const base =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all active:scale-[0.97]";

  const variants = {
    primary: "btn-gold text-xs",
    outline:
      "border border-border/60 bg-muted/40 text-foreground hover:border-primary/40 hover:bg-muted/70 text-xs",
    ghost:
      "text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs",
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className={cn(base, variants[variant], className)}
      aria-label={label}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
      <Download className="h-3 w-3 shrink-0 opacity-60" />
      <span className="hidden text-[10px] opacity-60 sm:inline">{sublabel}</span>
    </button>
  );
}
