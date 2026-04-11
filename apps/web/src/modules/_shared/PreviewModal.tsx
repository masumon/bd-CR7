"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function PreviewModal({ open, onOpenChange, title, children }: PreviewModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[121] w-[min(96vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-4 shadow-2xl"
          aria-label={title}
        >
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold text-foreground">{title}</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="Close preview">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="max-h-[75vh] overflow-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
