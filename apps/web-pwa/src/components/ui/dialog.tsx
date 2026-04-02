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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm safe-x safe-top safe-bottom" role="presentation" onClick={onClose}>
      <div className="glass max-h-[min(88svh,42rem)] w-full max-w-lg overflow-hidden rounded-[1.5rem] shadow-soft" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X size={16} />
          </Button>
        </div>
        <div className="max-h-[calc(min(88svh,42rem)-4.5rem)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
