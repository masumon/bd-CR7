"use client";

import { motion } from "framer-motion";
import { Mic, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState(false);
  const [text, setText] = useState("");

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_rgba(59,130,246,0.5)]"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </motion.button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h4 className="text-sm font-semibold">SUMONIX AI</h4>
            <button
              type="button"
              onClick={() => setVoice((v) => !v)}
              className={`relative rounded-full p-2 ${voice ? "bg-rose-100 text-rose-600" : "bg-muted text-muted-foreground"}`}
            >
              <Mic className="h-4 w-4" />
              {voice ? <span className="absolute inset-0 animate-ping rounded-full border border-rose-400" /> : null}
            </button>
          </div>
          <div className="h-56 space-y-3 overflow-y-auto bg-background p-4 text-sm">
            <div className="rounded-xl bg-muted px-3 py-2 text-muted-foreground">Welcome. Ask for fund risk, progress analytics, or inventory anomalies.</div>
            <div className="ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-primary-foreground">Show me pending high-risk expenses.</div>
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <input value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Message SUMONIX AI" />
              <Button className="h-8 w-8 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
