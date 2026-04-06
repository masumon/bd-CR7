"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Dialog({ open, onClose, title, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm safe-x safe-top safe-bottom" role="presentation" onClick={onClose}>
      <div className="glass max-h-[min(90svh,48rem)] w-full max-w-3xl overflow-hidden rounded-[1.8rem] shadow-soft" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Quick Panel</p>
            <h3 className="mt-1 text-base font-semibold">{title}</h3>
          </div>
          <Button variant="ghost" onClick={onClose} className="h-10 w-10 rounded-full p-0" aria-label="Close dialog">
            <X size={16} />
          </Button>
        </div>
        <div className="max-h-[calc(min(88svh,46rem)-5.5rem)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
