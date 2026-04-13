"use client";

import { WifiOff, RefreshCw, Bot } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 px-4 text-foreground">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-border/80 bg-card/95 p-6 text-center shadow-xl backdrop-blur-sm">
        {/* Offline icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15">
          <WifiOff className="h-7 w-7 text-amber-400" aria-hidden="true" />
        </div>

        <div>
          <h1 className="text-base font-semibold text-foreground">
            You are offline / অফলাইনে আছেন
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            No internet connection. Cached pages are still available.
            <br />
            <span className="text-[13px] leading-relaxed">ইন্টারনেট নেই। ক্যাশড পেজগুলো এখনও দেখা যাবে।</span>
          </p>
        </div>

        <ul className="space-y-2 text-left text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
            Previously visited pages are accessible from cache
            <br />
            <span className="text-[11px] leading-relaxed">আগে খোলা পেজগুলো ক্যাশ থেকে দেখা যাবে।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
            Data entered offline will sync automatically when back online
            <br />
            <span className="text-[11px] leading-relaxed">অফলাইনে এন্ট্রি করা ডেটা ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।</span>
          </li>
          <li className="flex items-start gap-2">
            <Bot className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            SUMONIX AI is available offline with local responses
            <br />
            <span className="text-[11px] leading-relaxed">SUMONIX AI অফলাইনেও কাজ করবে।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
            Live data (reports, real-time updates) requires a connection
            <br />
            <span className="text-[11px] leading-relaxed">লাইভ ডেটার জন্য ইন্টারনেট দরকার।</span>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" />
          Try again / পুনরায় চেষ্টা করুন
        </button>
      </div>
    </main>
  );
}
