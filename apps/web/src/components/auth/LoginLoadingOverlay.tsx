"use client";

import Image from "next/image";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginLoadingOverlayProps {
  visible: boolean;
  complete?: boolean;
  onDone: () => void;
}

const WELCOME_OVERLAY_DURATION = 2000;

export function LoginLoadingOverlay({ visible, complete = false, onDone }: LoginLoadingOverlayProps) {
  useEffect(() => {
    if (!visible || !complete) return;
    const timer = setTimeout(() => {
      onDone();
    }, WELCOME_OVERLAY_DURATION);
    return () => clearTimeout(timer);
  }, [visible, complete, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="login-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 px-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xs rounded-3xl border border-border/70 bg-card/90 p-7 text-center shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
              className="mx-auto mb-4 h-11 w-11 rounded-full border-[3px] border-amber-300/25 border-t-amber-300"
            />
            <div className="mx-auto mb-3 h-11 w-11 overflow-hidden rounded-2xl border border-amber-300/20 bg-slate-900/70 p-2">
              <Image
                src="/icons/icon.svg"
                alt="BD CR7 Logo"
                width={28}
                height={28}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-amber-300">Signing you in...</h2>
            <p className="mt-1 text-xs text-muted-foreground">Please wait while we secure your session.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
