"use client";

import { useState } from "react";
import { Bot, Loader2, RefreshCw, Send, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AiPanel() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "ai"; text: string; loading?: boolean }>>([
    {
      id: "welcome",
      role: "ai",
      text: "আমি SUMONIX AI। আপনার finance, project, workforce, report, risk analysis এবং daily action plan-এ সাহায্য করতে প্রস্তুত।\n\nI am ready to assist with finance, project planning, risk analysis, and operational decisions.",
    },
  ]);
  const [prompt, setPrompt] = useState("Dashboard summary");
  const [message, setMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  // Auth is ready once the store has finished hydrating (initialize() resolved).
  // While hydrating, token may be null even for an authenticated user because
  // the JWT is not persisted — it is re-fetched from the live Supabase session.
  const authReady = hydrated && !authLoading;
  const isAuthenticated = authReady && Boolean(token);
  const isAuthPending = !hydrated || authLoading;

  const sendPrompt = async (input: string) => {
    if (isAuthPending) return;
    if (!isAuthenticated) {
      setMessage("Login required.");
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessage("");
    const userMessageId = `u-${Date.now()}`;
    const loadingId = `l-${Date.now()}`;

    const previousContext = messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");
    const composed = previousContext
      ? `Context:\n${previousContext}\n\nNew request:\n${trimmed}`
      : trimmed;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: trimmed },
      { id: loadingId, role: "ai", text: "", loading: true },
    ]);
    setPrompt("");

    try {
      const data = await apiRequest<{ reply?: string }>(
        "/api/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({ message: composed }),
        },
        token ?? undefined
      );
      const reply = data.reply || "No answer returned.";
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: loadingId, role: "ai", text: reply } : m)));
    } catch (err) {
      const fallback = (err as Error).message || "AI chat failed.";
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: loadingId, role: "ai", text: fallback } : m)));
    }
  };

  const askAi = async () => {
    if (loadingChat) return;
    setLoadingChat(true);
    try {
      await sendPrompt(prompt);
    } finally {
      setLoadingChat(false);
    }
  };

  const runHelper = async (helperPrompt: string) => {
    if (loadingChat) return;
    setLoadingChat(true);
    try {
      await sendPrompt(helperPrompt);
    } finally {
      setLoadingChat(false);
    }
  };

  const authStatusLabel = isAuthPending ? "Initializing…" : isAuthenticated ? "Active" : "Login Required";

  return (
    <div className="space-y-5">
      <WorkspaceHero
        badge="SUMONIX AI / বুদ্ধিমান সহকারী"
        stats={[
          { label: "Assistant Mode", value: "Advanced Chat" },
          { label: "Conversation", value: String(messages.filter((m) => !m.loading).length) },
          { label: "Auth Status", value: authStatusLabel },
        ]}
      />

      <Card>
        <CardContent className="space-y-5 p-5">
          <SectionHeader
            eyebrow="Assistant Desk / সহকারী ডেস্ক"
            title="Ask SUMONIX like a real chatbot"
          />

          {isAuthPending ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Initializing session…
            </div>
          ) : !isAuthenticated ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Please login to activate AI tools.</div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
              <div className="flex flex-wrap gap-2">
                {["Dashboard summary", "Show risky expenses", "What modules can you guide?", "আজকের কাজ কি আগে করা উচিত?"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt(item)}
                    className="rounded-2xl border border-border bg-card px-3 py-2 text-left text-xs leading-5 text-muted-foreground transition hover:bg-muted/75 hover:text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="rounded-[1.2rem] border border-border bg-card/85 p-3">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask SUMONIX about finance, risks, projects, workers, or reports"
                  rows={4}
                  className="w-full resize-none bg-transparent text-sm leading-6 outline-none"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMessages((prev) => prev.slice(0, 1))}
                    disabled={loadingChat || messages.length <= 1}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Chat
                  </Button>
                  <Button onClick={askAi} disabled={!isAuthenticated || isAuthPending || loadingChat || !prompt.trim()} className="gap-2">
                    {loadingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ask SUMONIX
                  </Button>
                </div>
              </div>

              <div className="max-h-[26rem] space-y-2 overflow-y-auto rounded-[1.25rem] border border-primary/15 bg-primary/5 p-3 text-sm leading-7 text-foreground">
                {messages.map((entry) => (
                  <div key={entry.id} className={`rounded-2xl px-3 py-2 ${entry.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background/85"}`}>
                    <p className="mb-1 text-[11px] font-medium opacity-80">{entry.role === "user" ? "You / আপনি" : "SUMONIX AI"}</p>
                    {entry.loading ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                      </span>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{entry.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Smart Assistant Tools</p>
                    <p className="mt-1 text-xs text-muted-foreground">One tap prompts for instant operations guidance.</p>
                  </div>
                  <Button variant="outline" onClick={() => void runHelper("Analyze current expense risk and show top anomalies with reason.")} disabled={!isAuthenticated || loadingChat} className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    Analyze
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                <p className="text-sm font-semibold text-foreground">Workflow Copilot</p>
                <p className="mt-1 text-xs text-muted-foreground">Get next-step task plan across modules.</p>
                <div className="mt-3 grid gap-2">
                  <Button variant="outline" onClick={() => void runHelper("Create my prioritized action plan for today from dashboard data.")} disabled={!isAuthenticated || loadingChat} className="justify-start gap-2">
                    <Bot className="h-4 w-4" />
                    Today Priority Plan
                  </Button>
                  <Button variant="outline" onClick={() => void runHelper("Generate a bilingual (Bangla + English) status summary for management.")} disabled={!isAuthenticated || loadingChat} className="justify-start gap-2">
                    <Sparkles className="h-4 w-4" />
                    Bilingual Executive Summary
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {message ? <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}

          <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
            <SectionHeader
              eyebrow="AI File Processing / ফাইল প্রক্রিয়াকরণ"
              title="Assistant Mode Active"
            />
            <p className="mb-1 text-xs text-muted-foreground">
              SUMONIX AI এখন conversational assistant mode-এ সক্রিয়। আপনি finance, risk, reports, workforce এবং planning prompt দিয়ে তাৎক্ষণিক guidance পাবেন।
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
