"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const SPLASH_DURATION_MS = 2400;

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = supabase ? await supabase.auth.getSession() : null;
        if (result?.data.session) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="auth-page auth-bg-dark flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden">
      <motion.section
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-1 flex-col items-center justify-center text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.96, 1, 0.96] }}
          transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
          className="mb-5 rounded-3xl border border-amber-300/20 bg-slate-900/70 p-4 shadow-[0_0_42px_rgba(250,204,21,0.16)]"
        >
          <Image src="/icons/icon.svg" alt="BD CR7 Logo" width={84} height={84} priority />
        </motion.div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Welcome / স্বাগতম</h1>

        <div className="mt-5 flex items-center justify-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2.5 w-2.5 rounded-full bg-amber-300"
              animate={{ scale: [1, 1.42, 1], opacity: [0.35, 1, 0.35] }}
              transition={{ repeat: Infinity, duration: 0.95, delay: dot * 0.14, ease: "easeInOut" }}
            />
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Powered by</p>
        <p
          className="mt-0.5 text-sm font-bold uppercase tracking-[0.18em]"
          style={{
            background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SUMONIX AI
        </p>
        <div className="mt-2.5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Developed by</p>
          <p className="mt-0.5 text-xs font-medium text-white/82">Mumain Ahmed</p>
        </div>
      </motion.div>
    </main>
  );
}
