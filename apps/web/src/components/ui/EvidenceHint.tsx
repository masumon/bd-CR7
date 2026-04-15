"use client";

import { Camera, FileText, ImageIcon, Info, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Hint Catalogue ──────────────────────────────────────────────────────────
// Maps a (module, action) key → bilingual hint.
export type EvidenceContext =
  | "material-in"
  | "material-out"
  | "attendance"
  | "expense"
  | "progress"
  | "contractor-payment"
  | "default";

type HintConfig = {
  icon: typeof Info;
  en: string;
  bn: string;
  urgency: "required" | "recommended" | "optional";
};

const HINT_MAP: Record<EvidenceContext, HintConfig> = {
  "material-in": {
    icon: Upload,
    en: "Add delivery proof (photo / challan) to verify the receipt.",
    bn: "মালামাল বুঝে নেওয়ার প্রমাণ সংযুক্ত করুন (ছবি / চালান)।",
    urgency: "recommended",
  },
  "material-out": {
    icon: FileText,
    en: "Attach a dispatch note so the receiver can confirm the delivery.",
    bn: "বিতরণের ডকুমেন্ট সংযুক্ত করুন যাতে গ্রহীতা নিশ্চিত করতে পারে।",
    urgency: "optional",
  },
  attendance: {
    icon: Camera,
    en: "A site photo helps verify attendance during audits.",
    bn: "অ্যাটেন্ডেন্স যাচাইয়ের জন্য সাইটের একটি ছবি সহায়ক।",
    urgency: "recommended",
  },
  expense: {
    icon: ImageIcon,
    en: "Upload the receipt or invoice to support this expense.",
    bn: "এই খরচের রসিদ বা ইনভয়েস আপলোড করুন।",
    urgency: "recommended",
  },
  progress: {
    icon: Camera,
    en: "A progress photo makes this update verifiable in reports.",
    bn: "অগ্রগতির ছবি যোগ করলে রিপোর্টে যাচাই করা সহজ হয়।",
    urgency: "optional",
  },
  "contractor-payment": {
    icon: FileText,
    en: "Attach the signed bill or voucher before recording the payment.",
    bn: "পেমেন্ট রেকর্ড করার আগে স্বাক্ষরিত বিল বা ভাউচার সংযুক্ত করুন।",
    urgency: "required",
  },
  default: {
    icon: Info,
    en: "Adding evidence makes this record easier to audit.",
    bn: "প্রমাণ যোগ করলে রেকর্ডটি অডিটে সহজ হয়।",
    urgency: "optional",
  },
};

const URGENCY_STYLES: Record<HintConfig["urgency"], string> = {
  required:    "border-rose-400/40 bg-rose-500/06 text-rose-300",
  recommended: "border-primary/35 bg-primary/05 text-muted-foreground",
  optional:    "border-border/50 bg-muted/20 text-muted-foreground",
};

const URGENCY_ICON_COLOR: Record<HintConfig["urgency"], string> = {
  required:    "text-rose-400",
  recommended: "text-primary",
  optional:    "text-muted-foreground",
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useEvidenceHint(context: EvidenceContext): HintConfig {
  return HINT_MAP[context] ?? HINT_MAP.default;
}

// ─── Display Component ───────────────────────────────────────────────────────
type EvidenceHintProps = {
  context?: EvidenceContext;
  language?: "en" | "bn";
  className?: string;
};

export function EvidenceHint({ context = "default", language = "en", className }: EvidenceHintProps) {
  const hint = useEvidenceHint(context);
  const HintIcon = hint.icon;
  const message = language === "bn" ? hint.bn : hint.en;

  const urgencyLabel: Record<HintConfig["urgency"], { en: string; bn: string }> = {
    required:    { en: "Required",    bn: "আবশ্যক" },
    recommended: { en: "Recommended", bn: "প্রস্তাবিত" },
    optional:    { en: "Optional",    bn: "ঐচ্ছিক" },
  };
  const label = language === "bn"
    ? urgencyLabel[hint.urgency].bn
    : urgencyLabel[hint.urgency].en;

  return (
    <div
      className={cn(
        "evidence-hint",
        URGENCY_STYLES[hint.urgency],
        className,
      )}
      role="note"
      aria-label={`Evidence hint: ${message}`}
    >
      <HintIcon className={cn("evidence-hint-icon h-4 w-4 flex-shrink-0", URGENCY_ICON_COLOR[hint.urgency])} />
      <div className="min-w-0">
        <span className="mr-1.5 inline-flex items-center rounded-full border border-current/30 bg-current/08 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-70">
          {label}
        </span>
        <span className="text-[12px] leading-snug">{message}</span>
      </div>
    </div>
  );
}
