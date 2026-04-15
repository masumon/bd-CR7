"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { create } from "zustand";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
  },
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  const add = useToastStore((s) => s.add);

  return useMemo(
    () => ({
      success: (title: string, description?: string) =>
        add({ type: "success", title, description, duration: 4000 }),
      error: (title: string, description?: string) =>
        add({ type: "error", title, description, duration: 6000 }),
      info: (title: string, description?: string) =>
        add({ type: "info", title, description, duration: 4000 }),
      warning: (title: string, description?: string) =>
        add({ type: "warning", title, description, duration: 5000 }),
    }),
    [add]
  );
}

// ---------------------------------------------------------------------------
// Individual toast item
// ---------------------------------------------------------------------------

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error:   <XCircle      className="h-4 w-4 text-rose-500" />,
  info:    <Info         className="h-4 w-4 text-sky-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
};

const BORDER: Record<ToastType, string> = {
  success: "border-emerald-200/60 dark:border-emerald-800/50",
  error:   "border-rose-200/60 dark:border-rose-800/50",
  info:    "border-sky-200/60 dark:border-sky-800/50",
  warning: "border-amber-200/60 dark:border-amber-800/50",
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const timer = setTimeout(
      () => remove(toast.id),
      toast.duration ?? 4000,
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, remove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-background/97 px-4 py-3 shadow-xl backdrop-blur-md ${BORDER[toast.type]}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-5">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => remove(toast.id)}
        aria-label="Dismiss notification"
        className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Container — rendered once in the root layout
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-[calc(70px+env(safe-area-inset-bottom)+0.75rem)] right-3 z-[30] flex w-full max-w-[min(calc(100vw-1.5rem),24rem)] flex-col-reverse gap-2 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
