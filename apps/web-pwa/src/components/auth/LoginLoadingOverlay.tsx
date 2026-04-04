"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginLoadingOverlayProps {
  visible: boolean;
  onDone: () => void;
}

export function LoginLoadingOverlay({ visible, onDone }: LoginLoadingOverlayProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onDone();
    }, 2000);
    return () => clearTimeout(timer);
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="login-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(160deg, #0B1A13 0%, #0F2A1A 100%)" }}
        >
          {/* Logo circle */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.12, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(34,197,94,0.45) 0%, transparent 70%)", transform: "scale(1.8)" }}
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-950/60 shadow-[0_0_40px_rgba(34,197,94,0.25)]">
              <span className="font-display text-2xl font-black text-emerald-400">CR7</span>
            </div>
          </motion.div>

          {/* Brand text */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="font-display text-4xl font-black tracking-tight"
            style={{ color: "#D4A017" }}
          >
            BD CR7
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mt-1 text-sm font-semibold uppercase tracking-[0.22em]"
            style={{ color: "rgba(134,239,172,0.7)" }}
          >
            SUMONIX ERP
          </motion.p>

          {/* Welcome text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 text-lg font-semibold text-white/90"
          >
            Welcome! / স্বাগতম!
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-5 flex items-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18, ease: "easeInOut" }}
                className="h-2 w-2 rounded-full bg-emerald-400"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
