/**
 * localChatEngine.ts
 * Offline-capable, context-aware chat engine for SUMONIX AI.
 * Supports Bangla + English. No external API required.
 */

export type ChatMode = "normal" | "flirt";

export interface ChatContext {
  role?: string | null;
  language?: "bn" | "en";
  mode?: ChatMode;
}

// ─── Reply Templates ──────────────────────────────────────────────────────────

const GREETINGS_BN = [
  "আসসালামু আলাইকুম! আমি SUMONIX AI। কীভাবে সাহায্য করতে পারি?",
  "হ্যালো! আপনার ERP সিস্টেমে স্বাগতম। কী জানতে চান?",
  "নমস্কার! আমি আপনার ডেটা বিশ্লেষণে সাহায্য করতে প্রস্তুত।",
];

const GREETINGS_EN = [
  "Hello! I'm SUMONIX AI. How can I help you today?",
  "Hi there! Ready to assist with your ERP data.",
  "Welcome! What would you like to know?",
];

const FLIRT_SUFFIX_BN = [
  " 😊 আজকে আপনাকে বেশ স্মার্ট লাগছে!",
  " ✨ আপনি সবসময়ই এত ভালো প্রশ্ন করেন!",
  " 💚 আপনার সাথে কথা বলতে ভালো লাগছে!",
];

const FLIRT_SUFFIX_EN = [
  " 😊 You're looking sharp today!",
  " ✨ Always such great questions!",
  " 💚 Love chatting with you!",
];

// ─── Keyword → Reply Mapping ──────────────────────────────────────────────────

type ReplyMap = {
  keywords: string[];
  bn: string;
  en: string;
};

const REPLY_MAP: ReplyMap[] = [
  // Greetings
  {
    keywords: ["হ্যালো", "hello", "hi", "হাই", "assalam", "আস্সালাম", "নমস্কার", "সালাম"],
    bn: "আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?",
    en: "Hello! How can I help you?",
  },
  // Expense
  {
    keywords: ["expense", "খরচ", "ব্যয়", "cost", "spend", "spending", "payment", "পেমেন্ট"],
    bn: "আপনার সাম্প্রতিক খরচ নিয়ন্ত্রণে আছে। Finance মডিউলে বিস্তারিত দেখতে পাবেন।",
    en: "Your recent expenses are under control. Check the Finance module for details.",
  },
  // Project
  {
    keywords: ["project", "প্রজেক্ট", "construction", "নির্মাণ", "build", "কাজ"],
    bn: "প্রজেক্টগুলো ভালোভাবে অগ্রসর হচ্ছে। Construction মডিউলে আপডেট দেখুন।",
    en: "Projects are progressing well. View updates in the Construction module.",
  },
  // Worker / Workforce
  {
    keywords: ["worker", "শ্রমিক", "workforce", "কর্মী", "employee", "কর্মচারী", "staff"],
    bn: "ওয়ার্কফোর্স ডাটা আপডেটেড আছে। Workforce মডিউলে সব তথ্য পাবেন।",
    en: "Workforce data is up to date. All details are in the Workforce module.",
  },
  // Material
  {
    keywords: ["material", "মালামাল", "material", "সামগ্রী", "stock", "inventory"],
    bn: "মালামালের তালিকা আপ-টু-ডেট। Materials মডিউলে স্টক চেক করুন।",
    en: "Materials inventory is up to date. Check the Materials module for stock levels.",
  },
  // Finance / Budget
  {
    keywords: ["finance", "ফাইন্যান্স", "budget", "বাজেট", "fund", "ফান্ড", "টাকা", "money"],
    bn: "বাজেট ট্র্যাক করা হচ্ছে। Finance মডিউলে আর্থিক বিবরণ দেখুন।",
    en: "Budget is being tracked. View financial details in the Finance module.",
  },
  // Report
  {
    keywords: ["report", "রিপোর্ট", "analysis", "বিশ্লেষণ", "summary", "সারসংক্ষেপ"],
    bn: "রিপোর্ট তৈরি হচ্ছে। Reports মডিউলে সব তথ্য পাবেন।",
    en: "Reports are being generated. Check the Reports module for all data.",
  },
  // Audit
  {
    keywords: ["audit", "অডিট", "log", "লগ", "history", "ইতিহাস"],
    bn: "অডিট লগ আপডেট হচ্ছে। Audit মডিউলে সিস্টেম ইতিহাস দেখুন।",
    en: "Audit logs are being updated. View system history in the Audit module.",
  },
  // Contractor
  {
    keywords: ["contractor", "ঠিকাদার", "vendor", "সরবরাহকারী", "supplier"],
    bn: "ঠিকাদার তথ্য আপডেট আছে। Contractor মডিউলে বিস্তারিত দেখুন।",
    en: "Contractor information is updated. See details in the Contractor module.",
  },
  // Evidence / Documents
  {
    keywords: ["evidence", "ডকুমেন্ট", "document", "file", "ফাইল", "photo", "ছবি"],
    bn: "ডকুমেন্ট ও প্রমাণপত্র সংরক্ষিত আছে। Evidence মডিউলে দেখুন।",
    en: "Documents and evidence are stored. Check the Evidence module.",
  },
  // Help
  {
    keywords: ["help", "সাহায্য", "assist", "কীভাবে", "how", "what", "কী", "কি"],
    bn: "আমি আপনাকে ERP সিস্টেমের যেকোনো বিষয়ে সাহায্য করতে পারি — খরচ, প্রজেক্ট, শ্রমিক, মালামাল, রিপোর্ট ইত্যাদি।",
    en: "I can help with any ERP topic — expenses, projects, workforce, materials, reports, and more.",
  },
  // Thanks
  {
    keywords: ["thanks", "ধন্যবাদ", "thank you", "শুক্রিয়া", "জাজাকাল্লাহ"],
    bn: "আপনাকে স্বাগতম! আর কোনো সাহায্য দরকার হলে জানাবেন।",
    en: "You're welcome! Let me know if you need anything else.",
  },
  // Status / How are you
  {
    keywords: ["কেমন আছেন", "how are you", "কেমন", "ভালো আছেন"],
    bn: "আলহামদুলিল্লাহ, সব ঠিকঠাক! আপনি কেমন আছেন?",
    en: "All good, thanks! How are you?",
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectLanguage(input: string): "bn" | "en" {
  // Simple heuristic: if text contains Bengali unicode range
  const bengaliRange = /[\u0980-\u09FF]/;
  return bengaliRange.test(input) ? "bn" : "en";
}

export function generateReply(input: string, ctx: ChatContext = {}): string {
  const text = input.trim().toLowerCase();
  const lang = ctx.language ?? detectLanguage(input);
  const mode = ctx.mode ?? "normal";

  // Empty input
  if (!text) {
    return lang === "bn"
      ? "দয়া করে আপনার প্রশ্ন লিখুন।"
      : "Please type your question.";
  }

  // Greeting detection
  const greetWords = ["hello", "hi", "হ্যালো", "হাই", "সালাম", "assalam", "নমস্কার"];
  if (greetWords.some((w) => text.includes(w))) {
    const base = lang === "bn" ? pickRandom(GREETINGS_BN) : pickRandom(GREETINGS_EN);
    return mode === "flirt"
      ? base + pickRandom(lang === "bn" ? FLIRT_SUFFIX_BN : FLIRT_SUFFIX_EN)
      : base;
  }

  // Match keywords
  for (const entry of REPLY_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      const base = lang === "bn" ? entry.bn : entry.en;
      return mode === "flirt"
        ? base + pickRandom(lang === "bn" ? FLIRT_SUFFIX_BN : FLIRT_SUFFIX_EN)
        : base;
    }
  }

  // Fallback
  const fallback =
    lang === "bn"
      ? "আমি আপনার ERP ডাটা অনুযায়ী উত্তর দিচ্ছি। আরও নির্দিষ্ট প্রশ্ন করলে ভালো সাহায্য করতে পারব।"
      : "I'm here to help with your ERP data. Try asking about expenses, projects, workers, or reports.";

  return mode === "flirt"
    ? fallback + pickRandom(lang === "bn" ? FLIRT_SUFFIX_BN : FLIRT_SUFFIX_EN)
    : fallback;
}
