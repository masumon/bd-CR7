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
        aria-label={open ? "Close SUMONIX AI chat" : "Open SUMONIX AI chat"}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_rgba(15,108,90,0.42)] sm:right-6 lg:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </motion.button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+9.25rem)] top-auto z-50 max-h-[min(70svh,40rem)] overflow-hidden rounded-[1.5rem] border border-white/20 bg-card/92 shadow-soft backdrop-blur-sm sm:inset-x-auto sm:bottom-[calc(env(safe-area-inset-bottom)+9rem)] sm:right-6 sm:w-[min(420px,calc(100vw-2rem))] lg:bottom-24"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h4 className="text-sm font-semibold">SUMONIX AI</h4>
            <button
              type="button"
              onClick={() => setVoice((v) => !v)}
              aria-label={voice ? "Disable voice mode" : "Enable voice mode"}
              className={`relative rounded-full p-2 transition-all active:scale-95 ${voice ? "bg-rose-100 text-rose-600" : "bg-muted text-muted-foreground"}`}
            >
              <Mic className="h-4 w-4" />
              {voice ? <span className="absolute inset-0 animate-ping rounded-full border border-rose-400" /> : null}
            </button>
          </div>
          <div className="h-[min(46svh,20rem)] space-y-3 overflow-y-auto bg-background p-4 text-sm">
            <div className="rounded-xl bg-muted px-3 py-2 text-muted-foreground">Welcome. Ask for fund risk, progress analytics, or inventory anomalies.</div>
            <div className="ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-primary-foreground">Show me pending high-risk expenses.</div>
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <input value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Message SUMONIX AI" aria-label="Message SUMONIX AI" />
              <Button type="button" className="h-9 w-9 p-0" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
