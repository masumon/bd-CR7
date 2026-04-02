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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="glass w-full max-w-lg rounded-2xl shadow-soft">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X size={16} />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
