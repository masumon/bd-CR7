"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Mic, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  loading?: boolean;
};

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  content:
    "আমি SUMONIX AI — আপনার ERP সহকারী। তহবিল ঝুঁকি, অস্বাভাবিক ব্যয়, শ্রমিক উপস্থিতি বা যেকোনো তথ্য জিজ্ঞেস করুন।\n\nWelcome! Ask me about fund risk, anomalies, worker stats, or any financial insights.",
};

function classifyMessage(text: string): "anomalies" | "dashboard" | "general" {
  const t = text.toLowerCase();
  if (t.match(/anomal|risk|suspicious|সন্দেহ|ঝুঁকি|অস্বাভাবিক/)) return "anomalies";
  if (t.match(/dashboard|summary|overview|total|balance|তহবিল|ব্যালেন্স|সারসংক্ষেপ/)) return "dashboard";
  return "general";
}

function formatAIResponse(endpoint: "anomalies" | "dashboard" | "general", data: unknown): string {
  try {
    if (endpoint === "anomalies") {
      const rows = data as { account_id: string; risk_level: string; risk_score: number; reasons: string[] }[];
      if (!rows.length) return "✅ কোনো অস্বাভাবিক লেনদেন পাওয়া যায়নি। No anomalies detected.";
      const top = rows.slice(0, 3);
      return (
        `⚠️ ${rows.length}টি অস্বাভাবিক লেনদেন শনাক্ত হয়েছে:\n\n` +
        top
          .map(
            (r, i) =>
              `${i + 1}. Risk Level: **${r.risk_level.toUpperCase()}** (Score: ${r.risk_score})\n   Reasons: ${r.reasons.join(", ") || "none"}`
          )
          .join("\n\n")
      );
    }
    if (endpoint === "dashboard") {
      const d = data as Record<string, unknown>;
      const lines: string[] = ["📊 **ড্যাশবোর্ড সারসংক্ষেপ / Dashboard Summary**\n"];
      if (d.total_expenses !== undefined) lines.push(`💸 মোট ব্যয়: ৳${Number(d.total_expenses).toLocaleString()}`);
      if (d.pending_expenses !== undefined) lines.push(`⏳ অনুমোদন বাকি: ${d.pending_expenses} টি`);
      if (d.total_workers !== undefined) lines.push(`👷 মোট শ্রমিক: ${d.total_workers}`);
      if (d.total_projects !== undefined) lines.push(`🏗️ প্রজেক্ট: ${d.total_projects}`);
      if (d.fund_balance !== undefined) lines.push(`💰 ব্যালেন্স: ৳${Number(d.fund_balance).toLocaleString()}`);
      return lines.join("\n") || JSON.stringify(d, null, 2);
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const token = useAuthStore((s) => s.token);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    const loadingMsg: Message = { id: `loading-${Date.now()}`, role: "ai", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setText("");

    const endpoint = classifyMessage(trimmed);

    try {
      const data = await apiRequest<{ reply?: string; intent?: "anomalies" | "dashboard" | "general"; data?: unknown; items?: unknown }>(
        "/api/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({ message: trimmed }),
        },
        token || undefined
      );
      const intent = data.intent || endpoint;
      const formatted = data.reply || formatAIResponse(intent, data.data ?? data.items ?? data);
      const reply = formatted;
      setMessages((prev) =>
        prev.map((m) => (m.loading ? { ...m, loading: false, content: reply } : m))
      );
    } catch (err) {
      const errMsg = (err as Error).message || "AI সংযোগে সমস্যা হয়েছে।";
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, loading: false, content: `❌ Error: ${errMsg}\n\nAPI_URL সেট করা না থাকলে backend চালু করুন।` }
            : m
        )
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close SUMONIX AI chat" : "Open SUMONIX AI chat"}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_rgba(15,108,90,0.42)] sm:right-6 lg:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+9.25rem)] top-auto z-50 flex max-h-[min(72svh,42rem)] flex-col overflow-hidden rounded-[1.5rem] border border-white/20 bg-card/95 shadow-2xl backdrop-blur-sm sm:inset-x-auto sm:bottom-[calc(env(safe-area-inset-bottom)+9rem)] sm:right-6 sm:w-[min(440px,calc(100vw-2rem))] lg:bottom-24"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">SUMONIX AI</h4>
                  <p className="text-[10px] text-muted-foreground">Financial Intelligence Engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoice((v) => !v)}
                aria-label={voice ? "Disable voice mode" : "Enable voice mode"}
                className={`relative rounded-full p-2 transition-all active:scale-95 ${voice ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40" : "bg-muted text-muted-foreground"}`}
              >
                <Mic className="h-4 w-4" />
                {voice && <span className="absolute inset-0 animate-ping rounded-full border border-rose-400" />}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Bot className="h-3 w-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.loading ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> বিশ্লেষণ করছি...
                      </span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-0">
              {["ঝুঁকিপূর্ণ ব্যয়", "Dashboard summary", "অস্বাভাবিক লেনদেন"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setText(q); }}
                  className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="জিজ্ঞেস করুন... / Ask anything"
                  aria-label="Message SUMONIX AI"
                />
                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="h-8 w-8 shrink-0 p-0"
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

