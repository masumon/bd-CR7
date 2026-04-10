/**
 * localChatEngine.ts
 * Offline-capable, context-aware chat engine for SUMONIX AI.
 * Supports Bangla + English. No external API required.
 * v7 — expanded keyword coverage, role-aware responses, offline detection.
 */

export type ChatMode = "normal" | "flirt";

export interface ChatContext {
  role?: string | null;
  language?: "bn" | "en";
  mode?: ChatMode;
  offline?: boolean;
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
    keywords: ["হ্যালো", "hello", "hi", "হাই", "assalam", "আস্সালাম", "নমস্কার", "সালাম", "walaikum", "ওয়ালাইকুম"],
    bn: "আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?",
    en: "Hello! How can I help you?",
  },
  // Expense / Cost
  {
    keywords: ["expense", "খরচ", "ব্যয়", "cost", "spend", "spending", "payment", "পেমেন্ট", "invoice", "ইনভয়েস", "bill", "বিল"],
    bn: "আপনার সাম্প্রতিক খরচ নিয়ন্ত্রণে আছে। Finance মডিউলে বিস্তারিত দেখতে পাবেন। নতুন খরচ যোগ করতে Finance → Add Expense-এ যান।",
    en: "Your recent expenses are tracked. Check the Finance module for details. To add a new expense, go to Finance → Add Expense.",
  },
  // Project
  {
    keywords: ["project", "প্রজেক্ট", "construction", "নির্মাণ", "build", "কাজ", "site", "সাইট", "structure", "কাঠামো"],
    bn: "প্রজেক্টগুলো সুষ্ঠুভাবে অগ্রসর হচ্ছে। Construction মডিউলে আপডেট দেখুন। নতুন প্রজেক্ট যোগ করতে Projects পেজে যান।",
    en: "Projects are progressing well. View updates in the Construction module. To add a new project, go to the Projects page.",
  },
  // Worker / Workforce
  {
    keywords: ["worker", "শ্রমিক", "workforce", "কর্মী", "employee", "কর্মচারী", "staff", "attendance", "উপস্থিতি", "wage", "বেতন", "salary"],
    bn: "ওয়ার্কফোর্স ডাটা আপডেটেড আছে। Workforce মডিউলে হাজিরা, বেতন এবং সব কর্মীর তথ্য পাবেন।",
    en: "Workforce data is up to date. Check attendance, wages, and all worker details in the Workforce module.",
  },
  // Material / Inventory
  {
    keywords: ["material", "মালামাল", "সামগ্রী", "stock", "inventory", "সিমেন্ট", "cement", "rod", "রড", "brick", "ইট", "sand", "বালু"],
    bn: "মালামালের তালিকা আপ-টু-ডেট। Materials মডিউলে স্টক ইন/আউট এবং ইনভেন্টরি চেক করুন।",
    en: "Materials inventory is current. Check stock in/out and inventory levels in the Materials module.",
  },
  // Finance / Budget / Fund
  {
    keywords: ["finance", "ফাইন্যান্স", "budget", "বাজেট", "fund", "ফান্ড", "টাকা", "money", "balance", "ব্যালেন্স", "ledger", "লেজার"],
    bn: "বাজেট ও ফান্ড ট্র্যাক হচ্ছে। Finance মডিউলে আর্থিক বিবরণ, ফান্ড ম্যানেজার এবং লেজার দেখুন।",
    en: "Budget and funds are tracked. View financial details, fund manager, and ledger in the Finance module.",
  },
  // Report / Analysis
  {
    keywords: ["report", "রিপোর্ট", "analysis", "বিশ্লেষণ", "summary", "সারসংক্ষেপ", "statistics", "পরিসংখ্যান", "chart", "চার্ট"],
    bn: "রিপোর্ট তৈরি হচ্ছে। Reports মডিউলে সামগ্রিক বিশ্লেষণ, চার্ট এবং PDF/CSV এক্সপোর্ট পাবেন।",
    en: "Reports are available. Check the Reports module for full analytics, charts, and PDF/CSV export.",
  },
  // Audit / Log
  {
    keywords: ["audit", "অডিট", "log", "লগ", "history", "ইতিহাস", "track", "ট্র্যাক", "activity", "কার্যক্রম"],
    bn: "অডিট লগ আপডেট হচ্ছে। Audit মডিউলে সিস্টেম ইতিহাস ও সকল কার্যক্রম দেখুন।",
    en: "Audit logs are updated in real time. View system history and all activities in the Audit module.",
  },
  // Contractor / Vendor
  {
    keywords: ["contractor", "ঠিকাদার", "vendor", "সরবরাহকারী", "supplier", "agreement", "চুক্তি", "contract"],
    bn: "ঠিকাদার তথ্য আপডেট আছে। Contractor মডিউলে চুক্তি ও বিস্তারিত তথ্য দেখুন।",
    en: "Contractor information is updated. See contract details in the Contractor module.",
  },
  // Evidence / Documents / Upload
  {
    keywords: ["evidence", "ডকুমেন্ট", "document", "file", "ফাইল", "photo", "ছবি", "upload", "আপলোড", "pdf", "image", "ইমেজ", "camera", "ক্যামেরা"],
    bn: "ডকুমেন্ট ও প্রমাণপত্র সংরক্ষিত আছে। Evidence মডিউলে ছবি, PDF ও ভিডিও আপলোড করতে পারবেন।",
    en: "Documents and evidence are stored. You can upload photos, PDFs, and videos in the Evidence module.",
  },
  // Dashboard / Overview
  {
    keywords: ["dashboard", "ড্যাশবোর্ড", "overview", "সংক্ষিপ্ত", "home", "হোম", "main", "মেইন"],
    bn: "ড্যাশবোর্ডে মোট বাজেট, ব্যয়, শ্রমিক সংখ্যা এবং প্রজেক্ট অগ্রগতি একনজরে দেখতে পাবেন।",
    en: "The dashboard shows total budget, expenses, worker count, and project progress at a glance.",
  },
  // Settings
  {
    keywords: ["settings", "সেটিংস", "setting", "config", "configuration", "theme", "থিম", "language", "ভাষা"],
    bn: "Settings মডিউলে থিম, ভাষা, নোটিফিকেশন এবং সব ফিচার পরিচালনা করতে পারবেন।",
    en: "In Settings, you can manage theme, language, notifications, and all features.",
  },
  // Offline
  {
    keywords: ["offline", "অফলাইন", "internet", "ইন্টারনেট", "connection", "সংযোগ", "sync", "সিঙ্ক"],
    bn: "অফলাইন মোডে ডেটা এন্ট্রি করতে পারবেন — ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।",
    en: "You can enter data offline — it will sync automatically when the connection is restored.",
  },
  // PWA / Install
  {
    keywords: ["pwa", "install", "ইনস্টল", "app", "অ্যাপ", "mobile", "মোবাইল", "phone", "ফোন"],
    bn: "BD CR7 ERP একটি PWA — মোবাইলে ইনস্টল করতে ব্রাউজারের 'Add to Home Screen' অপশন ব্যবহার করুন।",
    en: "BD CR7 ERP is a PWA — install it on your phone using the browser's 'Add to Home Screen' option.",
  },
  // Export
  {
    keywords: ["export", "এক্সপোর্ট", "download", "ডাউনলোড", "csv", "pdf", "print", "প্রিন্ট"],
    bn: "সব মডিউল থেকে PDF এবং CSV এক্সপোর্ট করতে পারবেন। মডিউল হেডারে Export বাটন দেখুন।",
    en: "You can export PDF and CSV from all modules. Look for the Export button in the module header.",
  },
  // Help
  {
    keywords: ["help", "সাহায্য", "assist", "কীভাবে", "how", "what", "কী", "কি", "guide", "গাইড"],
    bn: "আমি আপনাকে ERP সিস্টেমের যেকোনো বিষয়ে সাহায্য করতে পারি — খরচ, প্রজেক্ট, শ্রমিক, মালামাল, রিপোর্ট, সেটিংস ইত্যাদি।",
    en: "I can help with any ERP topic — expenses, projects, workforce, materials, reports, settings, and more.",
  },
  // Thanks
  {
    keywords: ["thanks", "ধন্যবাদ", "thank you", "শুক্রিয়া", "জাজাকাল্লাহ", "jazakallah", "jazak", "ধন্য"],
    bn: "আপনাকে স্বাগতম! আর কোনো সাহায্য দরকার হলে জানাবেন। 😊",
    en: "You're welcome! Let me know if you need anything else. 😊",
  },
  // Status / How are you
  {
    keywords: ["কেমন আছেন", "how are you", "কেমন", "ভালো আছেন", "how r u", "sup", "কী খবর"],
    bn: "আলহামদুলিল্লাহ, সব ঠিকঠাক! আপনি কেমন আছেন?",
    en: "All good, thanks! How are you?",
  },
  // Bye / Goodbye
  {
    keywords: ["bye", "goodbye", "বিদায়", "আসি", "দেখা হবে", "see you", "later"],
    bn: "আল্লাহ হাফেজ! যেকোনো প্রয়োজনে আবার আসুন। 👋",
    en: "Goodbye! Come back anytime you need help. 👋",
  },
  // Error / Problem
  {
    keywords: ["error", "সমস্যা", "problem", "issue", "bug", "ঠিক নেই", "কাজ করছে না", "not working", "broken"],
    bn: "সমস্যাটি জানান। সিস্টেম টিম সক্রিয় আছে। Settings → Advanced → Reset বা পেজ রিলোড করে দেখুন।",
    en: "Please describe the issue. Try refreshing the page or go to Settings → Advanced → Reset.",
  },
  // Login / Auth
  {
    keywords: ["login", "লগইন", "password", "পাসওয়ার্ড", "otp", "auth", "register", "রেজিস্ট্রার", "account"],
    bn: "লগইন সমস্যা হলে 'পাসওয়ার্ড ভুলে গেছেন' লিংক ব্যবহার করুন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।",
    en: "For login issues, use the 'Forgot Password' link or contact your admin.",
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
  const offline = ctx.offline ?? (typeof navigator !== "undefined" ? !navigator.onLine : false);

  // Empty input
  if (!text) {
    return lang === "bn"
      ? "দয়া করে আপনার প্রশ্ন লিখুন।"
      : "Please type your question.";
  }

  // Offline announcement
  if (offline && (text.includes("offline") || text.includes("অফলাইন") || text.includes("internet") || text.includes("ইন্টারনেট"))) {
    const base = lang === "bn"
      ? "আপনি এখন অফলাইনে আছেন। কিন্তু চিন্তা নেই — আমি সম্পূর্ণ কাজ করছি! ডেটা এন্ট্রি করুন, ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে। ✅"
      : "You're currently offline. No worries — I'm fully functional! Enter data as usual; it will sync automatically when you're back online. ✅";
    return mode === "flirt"
      ? base + pickRandom(lang === "bn" ? FLIRT_SUFFIX_BN : FLIRT_SUFFIX_EN)
      : base;
  }

  // Greeting detection
  const greetWords = ["hello", "hi", "হ্যালো", "হাই", "সালাম", "assalam", "নমস্কার", "walaikum", "ওয়ালাইকুম"];
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

  // Role-aware fallback
  const roleFallback: Record<string, { bn: string; en: string }> = {
    admin: {
      bn: "অ্যাডমিন হিসেবে আপনার সব মডিউলে অ্যাক্সেস আছে। কোন মডিউল নিয়ে জানতে চান?",
      en: "As admin, you have access to all modules. Which one would you like to know about?",
    },
    accountant: {
      bn: "হিসাবরক্ষক হিসেবে Finance ও Reports মডিউল আপনার জন্য সবচেয়ে প্রাসঙ্গিক।",
      en: "As accountant, the Finance and Reports modules are most relevant for you.",
    },
    supervisor: {
      bn: "সুপারভাইজার হিসেবে Construction, Workforce ও Materials মডিউল আপনার জন্য গুরুত্বপূর্ণ।",
      en: "As supervisor, the Construction, Workforce, and Materials modules are key for you.",
    },
  };

  const roleKey = (ctx.role ?? "").toLowerCase();
  if (roleKey && roleFallback[roleKey]) {
    const base = lang === "bn" ? roleFallback[roleKey].bn : roleFallback[roleKey].en;
    return mode === "flirt"
      ? base + pickRandom(lang === "bn" ? FLIRT_SUFFIX_BN : FLIRT_SUFFIX_EN)
      : base;
  }

  // Generic fallback
  const fallback =
    lang === "bn"
      ? "আমি আপনার ERP ডাটা অনুযায়ী উত্তর দিচ্ছি। আরও নির্দিষ্ট প্রশ্ন করলে ভালো সাহায্য করতে পারব — যেমন খরচ, প্রজেক্ট, শ্রমিক, মালামাল, রিপোর্ট ইত্যাদি।"
      : "I'm here to help with your ERP data. Try asking about expenses, projects, workers, materials, reports, settings, or uploads.";

  return mode === "flirt"
    ? fallback + pickRandom(lang === "bn" ? FLIRT_SUFFIX_BN : FLIRT_SUFFIX_EN)
    : fallback;
}
