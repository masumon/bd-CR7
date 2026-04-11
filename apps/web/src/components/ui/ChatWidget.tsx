"use client";

/**
 * ChatWidget — Floating, draggable AI chat widget.
 * Features: Bangla+English, Flirt Mode, typing indicator,
 * auto-scroll, message history, framer-motion animations.
 * v7 — offline-aware, expanded AI context.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Heart,
  Cpu,
  ChevronDown,
  Trash2,
  GripVertical,
  WifiOff,
} from "lucide-react";

import { generateReply, type ChatMode } from "@/lib/localChatEngine";
import { useAuthStore } from "@/store/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  ts: number;
}

// ─── ChatWidget ───────────────────────────────────────────────────────────────

export function ChatWidget() {
  const role = useAuthStore((s) => s.role);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState<ChatMode>("normal");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "আস্সালামু আলাইকুম! আমি SUMONIX AI। আপনার ERP বিষয়ে সাহায্য করতে এসেছি। 🤖",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [online, setOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();
  const constraintRef = useRef<HTMLDivElement>(null);
  const fabDragging = useRef(false);

  // Track online/offline status
  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, minimized]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate thinking delay (300–800ms)
    const delay = 300 + Math.random() * 500;
    await new Promise((r) => setTimeout(r, delay));

    const reply = generateReply(text, { role, language: lang, mode, offline: !online });
    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: reply,
      ts: Date.now(),
    };

    setTyping(false);
    setMessages((prev) => [...prev, aiMsg]);
  }, [input, lang, mode, role, online]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "ai",
        text:
          lang === "bn"
            ? "চ্যাট রিসেট হয়েছে। কীভাবে সাহায্য করতে পারি?"
            : "Chat reset. How can I help you?",
        ts: Date.now(),
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Drag constraint layer — always mounted so FAB can use it */}
      <div ref={constraintRef} className="pointer-events-none fixed inset-0 z-[30]" />

      <AnimatePresence mode="wait">
        {/* ── FAB (closed state) ───────────────────────────────────────── */}
        {!open && (
          <motion.button
            key="chat-fab"
            drag
            dragConstraints={constraintRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => { fabDragging.current = true; }}
            onDragEnd={() => { setTimeout(() => { fabDragging.current = false; }, 80); }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (!fabDragging.current) setOpen(true); }}
            className="fixed bottom-[calc(74px+env(safe-area-inset-bottom))] right-4 z-[30] cursor-grab touch-none rounded-full border border-cyan-400/35 bg-cyan-400/10 p-1.5 shadow-[0_10px_30px_rgba(0,255,210,0.22)] backdrop-blur-md active:cursor-grabbing lg:bottom-7"
            aria-label="Open AI Chat"
          >
            <Image
              src="/icons/sumonix-ai.png"
              alt="AI Assistant"
              width={56}
              height={56}
              className="h-12 w-12 object-contain drop-shadow-[0_0_14px_rgba(0,255,200,0.7)]"
              onError={(e) => {
                const t = e.currentTarget;
                t.onerror = null;
                t.src = "/icons/sumonix-ai.svg";
              }}
            />
          </motion.button>
        )}

        {/* ── Chat Window ──────────────────────────────────────────────── */}
        {open && (
        <motion.div
          key="chat-window"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraintRef}
          dragElastic={0.08}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-[calc(78px+env(safe-area-inset-bottom))] right-4 z-[30] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-cyan-400/20 bg-card/95 shadow-2xl backdrop-blur-md lg:bottom-7"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}
        >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-2 border-b border-border/50 bg-gradient-to-r from-primary/15 to-accent/10 px-3 py-2.5"
        >
          {/* Drag handle */}
          <div
            className="cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground leading-tight">SUMONIX AI</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {!online
                ? <span className="flex items-center gap-0.5 text-amber-400"><WifiOff className="inline h-2.5 w-2.5" /> Offline</span>
                : mode === "flirt" ? "😊 Flirt Mode" : "🤖 Normal Mode"
              }
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
              className="rounded-lg px-1.5 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted transition-colors"
              title="Toggle language"
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>

            {/* Mode toggle */}
            <button
              onClick={() => setMode((m) => (m === "normal" ? "flirt" : "normal"))}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                mode === "flirt"
                  ? "bg-rose-500/20 text-rose-400"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={mode === "flirt" ? "Switch to Normal" : "Switch to Flirt Mode"}
            >
              {mode === "flirt" ? <Heart className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5" />}
            </button>

            {/* Clear */}
            <button
              onClick={clearChat}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Minimize */}
            <button
              onClick={() => setMinimized((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title={minimized ? "Expand" : "Minimize"}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${minimized ? "rotate-180" : ""}`}
              />
            </button>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Body (collapsible) ── */}
        <AnimatePresence>
          {!minimized && (
            <motion.div
              key="chat-body"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Messages */}
              <div className="flex h-64 flex-col gap-2 overflow-y-auto p-3 scroll-smooth">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm border border-border/50"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {typing && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="rounded-2xl rounded-bl-sm border border-border/50 bg-muted px-3 py-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{
                                repeat: Infinity,
                                duration: 1,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 border-t border-border/50 bg-background/60 px-3 py-2.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={lang === "bn" ? "প্রশ্ন লিখুন..." : "Type your question..."}
                  className="h-9 min-h-0 flex-1 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/50"
                  disabled={typing}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || typing}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
