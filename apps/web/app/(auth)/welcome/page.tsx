"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const SPLASH_DURATION_MS = 600;

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = supabase ? await supabase.auth.getSession() : null;
        if (result?.data.session) {
          router.replace("/dashboard");
        } else {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("bdcr7-login-splash-shown", "1");
          }
          router.replace("/login");
        }
      } catch {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("bdcr7-login-splash-shown", "1");
        }
        router.replace("/login");
      }
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      className="auth-bg-bdcr7 relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-y-auto overflow-x-hidden"
    >
      {/* Animated bg overlay (from CSS class) */}
      <motion.section
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-5"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.94, 1, 0.94] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="mb-6 rounded-3xl border border-amber-300/20 bg-slate-900/60 p-5 shadow-[0_0_48px_rgba(251,189,35,0.18)]"
        >
          <Image src="/icons/icon.svg" alt="BD CR7 Logo" width={88} height={88} priority />
        </motion.div>

        <h1 className="font-[var(--font-outfit-var)] text-3xl font-bold tracking-tight text-white">
          স্বাগতম /{" "}
          <span className="font-[var(--font-hind-var)]">Welcome</span>
        </h1>

        <div className="mt-6 flex items-center justify-center gap-2.5">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2.5 w-2.5 rounded-full bg-[var(--bdcr7-gold)]"
              animate={{ scale: [1, 1.45, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.95, delay: dot * 0.16, ease: "easeInOut" }}
            />
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.45 }}
        className="relative z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
          পরিচালনায়
        </p>
        <p
          className="mt-0.5 text-sm font-bold uppercase tracking-[0.18em] gold-text-gradient"
        >
          SUMONIX AI
        </p>
      </motion.div>
    </main>
  );
}
