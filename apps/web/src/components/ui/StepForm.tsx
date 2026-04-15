"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepConfig = {
  id: string;
  /** Short label shown in the step indicator */
  label: string;
  /** Optional: called before advancing. Return false to block navigation. */
  validate?: () => boolean | Promise<boolean>;
};

type StepFormRenderProps = {
  currentStep: number;
  totalSteps: number;
  stepId: string;
  isFirst: boolean;
  isLast: boolean;
  goNext: () => Promise<void>;
  goPrev: () => void;
  goTo: (index: number) => void;
};

type StepFormProps = {
  steps: StepConfig[];
  children: (props: StepFormRenderProps) => React.ReactNode;
  /** Called when the user completes all steps */
  onComplete?: () => void;
  language?: "en" | "bn";
  className?: string;
  /** Hide the built-in prev/next buttons and render them yourself */
  hideControls?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StepForm({
  steps,
  children,
  onComplete,
  language = "en",
  className,
  hideControls = false,
}: StepFormProps) {
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const totalSteps = steps.length;
  const isFirst = current === 0;
  const isLast  = current === totalSteps - 1;

  const goNext = useCallback(async () => {
    const step = steps[current];
    if (step.validate) {
      const ok = await step.validate();
      if (!ok) return;
    }
    setCompleted((prev) => new Set([...prev, current]));
    if (isLast) {
      onComplete?.();
    } else {
      setCurrent((c) => c + 1);
    }
  }, [current, isLast, onComplete, steps]);

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrent((c) => c - 1);
  }, [isFirst]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) setCurrent(index);
  }, [totalSteps]);

  const labels = {
    prev: language === "bn" ? "পূর্ববর্তী" : "Previous",
    next: language === "bn" ? "পরবর্তী"    : "Next",
    done: language === "bn" ? "সম্পন্ন"    : "Done",
  };

  const stepData = steps[current];

  return (
    <div className={cn("space-y-4", className)}>

      {/* ── Step indicator ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="step-indicator flex-1">
          {steps.map((step, i) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to step ${i + 1}: ${step.label}`}
              className={cn(
                "step-dot",
                i === current && "active",
                completed.has(i) && "done",
              )}
              title={step.label}
            />
          ))}
        </div>
        <span className="flex-shrink-0 text-[11px] text-muted-foreground">
          {language === "bn"
            ? `${current + 1} / ${totalSteps}`
            : `Step ${current + 1} of ${totalSteps}`}
        </span>
      </div>

      {/* ── Step label ── */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {stepData.label}
      </p>

      {/* ── Step content ── */}
      <div>
        {children({
          currentStep: current,
          totalSteps,
          stepId: stepData.id,
          isFirst,
          isLast,
          goNext,
          goPrev,
          goTo,
        })}
      </div>

      {/* ── Navigation controls ── */}
      {!hideControls && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {labels.prev}
          </button>

          <button
            type="button"
            onClick={goNext}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              isLast
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "btn-bdcr7-gold",
            )}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {labels.done}
              </>
            ) : (
              <>
                {labels.next}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Convenience: single step content wrapper ─────────────────────────────────

type StepPanelProps = {
  stepId: string;
  currentStepId: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Renders children only when `stepId === currentStepId`.
 * Use inside a StepForm render-prop to gate field groups per step.
 */
export function StepPanel({ stepId, currentStepId, children, className }: StepPanelProps) {
  if (stepId !== currentStepId) return null;
  return <div className={cn("animate-fade-in-up", className)}>{children}</div>;
}
