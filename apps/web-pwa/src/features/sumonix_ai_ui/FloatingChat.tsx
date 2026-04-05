"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Loader2, Mic, Minus, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// Inline "S" SVG logo for the FAB — keeps the SUMONIX brand mark
function SumonixFabIcon({ size = 28 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `fc-bg-${uid}`;
  const filterId = `fc-shadow-${uid}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
        <filter id={filterId}>
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <rect width="100" height="100" rx="24" fill={`url(#${gradId})`} />
      <circle cx="76" cy="24" r="10" fill="#f59e0b" opacity="0.9" />
      <text
        x="50"
        y="73"
        textAnchor="middle"
        fontFamily="'Arial Black','Helvetica Neue',Impact,sans-serif"
        fontSize="68"
        fontWeight="900"
        fill="white"
        filter={`url(#${filterId})`}
      >
        S
      </text>
    </svg>
  );
}

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  loading?: boolean;
};

type SpeechRecognitionAlternativeLike = { transcript?: string };
type SpeechRecognitionResultLike = { 0?: SpeechRecognitionAlternativeLike };
type SpeechRecognitionEventLike = { results?: { 0?: SpeechRecognitionResultLike } };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtorLike = new () => SpeechRecognitionLike;

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  content:
    "আমি SUMONIX AI। আপনি dashboard summary, risky expense, project guidance, বা module help চাইতে পারেন।\n\nI am ready to help with dashboard summaries, anomalies, project context, and workflow guidance.",
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

const FAB_SIZE_PX = 56; // matches h-14 w-14 (Tailwind: 3.5rem = 56px)
const FAB_EDGE_MARGIN_PX = 16; // right-4 default
const LONG_PRESS_DURATION_MS = 500;

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [voice, setVoice] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [longPressMenu, setLongPressMenu] = useState(false);
  const token = useAuthStore((s) => s.token);
  const role  = useAuthStore((s) => s.role);
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  // Motion values for FAB snap-to-edge
  const fabX = useMotionValue(0);
  const fabY = useMotionValue(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtorLike;
      webkitSpeechRecognition?: SpeechRecognitionCtorLike;
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    const canUseRecognition = Boolean(SpeechRecognitionCtor);
    const canUseSynthesis = Boolean(window.speechSynthesis);
    setSpeechSupported(canUseRecognition && canUseSynthesis);

    if (!canUseRecognition || !SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = document.documentElement.lang === "bn" ? "bn-BD" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore teardown failures from browser speech APIs.
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch critical system alerts once on mount for admin/super_admin
  useEffect(() => {
    const isAdmin = role === "admin" || role === "super_admin";
    if (!isAdmin || !token) return;
    apiRequest<{ critical_count?: number }>(
      "/api/ai/alerts",
      { method: "GET" },
      token,
    )
      .then((res) => setCriticalAlerts(res.critical_count ?? 0))
      .catch(() => {}); // never block UI on alert fetch failure
  }, [token, role]);

  const speak = (raw: string) => {
    if (!voice || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    const spokenText = raw.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim();
    if (!spokenText) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = document.documentElement.lang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    try {
      recognitionRef.current.lang = document.documentElement.lang === "bn" ? "bn-BD" : "en-US";
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

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
      speak(reply);
    } catch (err) {
      const errMsg = (err as Error).message || "AI connection failed.";
      const fallback = `SUMONIX AI could not answer right now.\n\n${errMsg}\n\nCheck API connectivity or sign in again if your session expired.`;
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, loading: false, content: fallback }
            : m
        )
      );
      speak(fallback);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Snap FAB to nearest horizontal edge after drag
  const handleDragEnd = () => {
    isDragging.current = false;
    if (typeof window === "undefined") return;
    // FAB default position: bottom-right (right: FAB_EDGE_MARGIN_PX). x=0 means at default.
    const rightEdgeDefault = window.innerWidth - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX; // px from left
    const currentAbsLeft = rightEdgeDefault + fabX.get();
    const center = currentAbsLeft + FAB_SIZE_PX / 2;

    // Snap to left or right edge
    if (center < window.innerWidth / 2) {
      // Snap to left
      const targetX = -(rightEdgeDefault - FAB_EDGE_MARGIN_PX);
      animate(fabX, targetX, { type: "spring", stiffness: 400, damping: 30 });
    } else {
      // Snap to right (default position x=0)
      animate(fabX, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  // Long-press detection
  const startLongPress = () => {
    isDragging.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        setLongPressMenu(true);
      }
    }, LONG_PRESS_DURATION_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleFabClick = () => {
    if (longPressMenu) return; // menu was shown via long-press, don't toggle chat
    setOpen((v) => !v);
  };

  return (
    <>
      {/* Long-press context menu */}
      <AnimatePresence>
        {longPressMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setLongPressMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 12 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] right-4 z-50 flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-background/97 p-2 shadow-2xl backdrop-blur-lg lg:bottom-[calc(env(safe-area-inset-bottom)+3.5rem)]"
            >
              <button
                type="button"
                onClick={() => { setLongPressMenu(false); setOpen(true); setMinimized(false); }}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#16a34a,#15803d)]">
                  <SumonixFabIcon size={13} />
                </span>
                Open AI Chat
              </button>
              <button
                type="button"
                onClick={() => { setLongPressMenu(false); setText("Quick Add: "); setOpen(true); setMinimized(false); }}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Quick Add
              </button>
              <button
                type="button"
                onClick={() => { setLongPressMenu(false); setVoice(true); setOpen(true); setMinimized(false); }}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Mic className="h-4 w-4 text-sky-500" />
                Voice Input
              </button>
              <button
                type="button"
                onClick={() => setLongPressMenu(false)}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Draggable FAB with snap-to-edge */}
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={{ top: -600, left: -300, right: 0, bottom: 0 }}
        style={{ x: fabX, y: fabY, maxWidth: FAB_SIZE_PX, maxHeight: FAB_SIZE_PX }}
        onDragStart={() => { isDragging.current = true; cancelLongPress(); }}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        type="button"
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onClick={handleFabClick}
        aria-label={open ? "Close SUMONIX AI" : "Open SUMONIX AI"}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-50 flex h-14 w-14 cursor-grab items-center justify-center rounded-full border border-white/25 bg-[linear-gradient(135deg,#16a34a_0%,#15803d_60%,#14532d_100%)] shadow-[0_4px_24px_rgba(22,163,74,0.45),0_1px_4px_rgba(0,0,0,0.3)] animate-float active:cursor-grabbing lg:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-5 w-5 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="s-logo"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <SumonixFabIcon size={30} />
            </motion.span>
          )}
        </AnimatePresence>
        {/* pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-erp-pulse" />
        )}
        {/* inner glow */}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.18),transparent_65%)]" />
        {/* critical alerts badge — visible only for admin when there are critical issues */}
        {criticalAlerts > 0 && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white shadow-md">
            {criticalAlerts > 9 ? "9+" : criticalAlerts}
          </span>
        )}
      </motion.button>

          <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed z-50 flex flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,249,247,0.97))] backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(15,24,21,0.99),rgba(10,19,17,0.98))] bottom-[calc(env(safe-area-inset-bottom)+8.75rem)] right-2 left-2 max-h-[min(74svh,44rem)] rounded-[1.75rem] border border-white/25 shadow-[0_8px_40px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.08)] sm:left-auto sm:right-6 sm:w-[min(460px,calc(100vw-2rem))] lg:bottom-24"
          >
            <div className="safe-top flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-transparent px-4 py-3 dark:from-emerald-950/80">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#16a34a,#15803d)] shadow-[0_2px_8px_rgba(22,163,74,0.45)]">
                  <SumonixFabIcon size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">SUMONIX AI</h4>
                  <p className="text-[11px] leading-4 text-emerald-600 dark:text-emerald-400">ERP Assistant · Ready</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!speechSupported) {
                    return;
                  }
                  setVoice((v) => !v);
                  if (listening) {
                    recognitionRef.current?.stop();
                    setListening(false);
                  }
                }}
                aria-label={voice ? "Disable voice mode" : "Enable voice mode"}
                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 ${voice ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40" : "bg-muted text-muted-foreground"} ${speechSupported ? "" : "cursor-not-allowed opacity-50"}`}
              >
                <Mic className="h-4 w-4" />
                {voice && <span className="absolute inset-0 animate-ping rounded-full border border-rose-400" />}
              </button>
              <button
                type="button"
                onClick={() => setMinimized(true)}
                aria-label="Minimize chat"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-muted/80 active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-rose-100 hover:text-rose-600 active:scale-95 dark:hover:bg-rose-900/40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-2 text-[13px] sm:text-sm">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#16a34a,#15803d)]">
                      <SumonixFabIcon size={15} />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] break-words whitespace-pre-wrap rounded-2xl px-3 py-2.5 leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/60 bg-muted/80 text-foreground"
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

            <div className="grid grid-cols-2 gap-2 px-4 pb-2 pt-0 sm:grid-cols-4">
              {["Dashboard summary", "Show risky expenses", "কি কি module আছে?", "আজকের কাজের অগ্রাধিকার বলো"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setText(q);
                  }}
                  className="rounded-2xl border border-border bg-background/88 px-3 py-2 text-left text-[11px] leading-4 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="border-t border-border/60 bg-background/90 p-3 backdrop-blur-sm">
              <div className="mx-auto flex w-full max-w-[28rem] items-center gap-2 rounded-[1.2rem] border border-border bg-background px-3 py-2">
                {voice ? (
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!speechSupported}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${listening ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40" : "bg-muted text-muted-foreground"}`}
                    aria-label={listening ? "Stop listening" : "Start voice input"}
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/60 focus-visible:outline-offset-2"
                  placeholder="জিজ্ঞেস করুন... / Ask anything"
                  aria-label="Message SUMONIX AI"
                />
                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="h-11 w-11 shrink-0 p-0"
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized pill */}
      <AnimatePresence>
        {open && minimized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={() => setMinimized(false)}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+7rem)] right-4 z-50 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-background/95 px-3 py-2 text-xs font-medium text-emerald-600 shadow-lg backdrop-blur-md dark:text-emerald-400 lg:bottom-[calc(env(safe-area-inset-bottom)+2.5rem)]"
          >
            <SumonixFabIcon size={16} />
            SUMONIX AI
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

