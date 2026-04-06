"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { easeAuth, fadeUp } from "./animations";

export function SplashView() {
  return (
    <motion.main
      key="splash"
      {...fadeUp}
      transition={{ duration: 0.45, ease: easeAuth }}
      className="flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-5"
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.95, 1, 0.95] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="mb-6 rounded-3xl border border-amber-300/20 bg-slate-900/60 p-5 shadow-[0_0_48px_rgba(251,189,35,0.18)]"
      >
        <Image src="/icons/icon.svg" alt="BD CR7" width={88} height={88} priority />
      </motion.div>

      <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-outfit-var)" }}>
        Welcome / <span style={{ fontFamily: "var(--font-hind-var)" }}>স্বাগতম</span>
      </h1>

      <div className="mt-6 flex items-center justify-center gap-2.5">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--bdcr7-gold)" }}
            animate={{ scale: [1, 1.45, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 0.95, delay: dot * 0.16, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.32)" }}>
          Powered by
        </p>
        <p className="mt-0.5 text-sm font-bold uppercase tracking-[0.18em] gold-text-gradient">SUMONIX AI</p>
      </div>
    </motion.main>
  );
}
