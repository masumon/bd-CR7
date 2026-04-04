"use client";

import { useState } from "react";
import { BrainCircuit, Loader2, Radar, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AiPanel() {
  const token = useAuthStore((s) => s.token);
  const [vector, setVector] = useState("[0.01,0.02,0.03]");
  const [anomalies, setAnomalies] = useState<Array<Record<string, unknown>>>([]);
  const [answer, setAnswer] = useState("");
  const [prompt, setPrompt] = useState("Dashboard summary");
  const [message, setMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);
  const [loadingMemory, setLoadingMemory] = useState(false);

  const loadAnomalies = async () => {
    if (!token) {
      setMessage("Login required.");
      return;
    }
    setMessage("");
    setLoadingAnomalies(true);
    try {
      const data = await apiRequest<Array<Record<string, unknown>>>("/api/ai/anomalies", {}, token);
      setAnomalies(data || []);
      if (!data?.length) {
        setMessage("No anomalies detected.");
      }
    } catch (err) {
      setMessage((err as Error).message || "Failed to load anomalies.");
    } finally {
      setLoadingAnomalies(false);
    }
  };

  const searchMemory = async () => {
    if (!token) {
      setMessage("Login required.");
      return;
    }
    setMessage("");
    setLoadingMemory(true);
    try {
      const data = await apiRequest<Array<Record<string, unknown>>>(
        `/api/ai/memory/search?vector=${encodeURIComponent(vector)}&top_k=5`,
        {},
        token
      );
      setAnomalies(data || []);
      if (!data?.length) {
        setMessage("No similar memory found.");
      }
    } catch (err) {
      setMessage((err as Error).message || "Memory search failed.");
    } finally {
      setLoadingMemory(false);
    }
  };

  const askAi = async () => {
    if (!token) {
      setMessage("Login required.");
      return;
    }
    setMessage("");
    setAnswer("");
    setLoadingChat(true);
    try {
      const data = await apiRequest<{ reply?: string }>(
        "/api/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({ message: prompt }),
        },
        token
      );
      setAnswer(data.reply || "No answer returned.");
    } catch (err) {
      setMessage((err as Error).message || "AI chat failed.");
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="space-y-5">
      <WorkspaceHero
        badge="SUMONIX AI / বুদ্ধিমান সহকারী"
        stats={[
          { label: "Assistant Mode", value: "Ready" },
          { label: "Anomaly Feed", value: String(anomalies.length) },
          { label: "Auth Status", value: token ? "Active" : "Login Required" },
        ]}
      />

      <Card>
        <CardContent className="space-y-5 p-5">
          <SectionHeader
            eyebrow="Assistant Desk / সহকারী ডেস্ক"
            title="Ask SUMONIX like a real chatbot"
          />

          {!token ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Please login to activate AI tools.</div> : null}

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
                <div className="mt-3 flex justify-end">
                  <Button onClick={askAi} disabled={!token || loadingChat || !prompt.trim()} className="gap-2">
                    {loadingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ask SUMONIX
                  </Button>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-primary/15 bg-primary/5 p-4 text-sm leading-7 text-foreground">
                {answer || "AI reply will appear here with a practical summary and next-step guidance."}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Anomaly Watch</p>
                    <p className="mt-1 text-xs text-muted-foreground">Review suspicious expense patterns.</p>
                  </div>
                  <Button variant="outline" onClick={loadAnomalies} disabled={!token || loadingAnomalies} className="gap-2">
                    {loadingAnomalies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                    Scan
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                <p className="text-sm font-semibold text-foreground">Memory Search</p>
                <p className="mt-1 text-xs text-muted-foreground">Use vector search when memory entries exist.</p>
                <div className="mt-3 flex items-center gap-2 rounded-[1.2rem] border border-border bg-card px-3 py-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input value={vector} onChange={(event) => setVector(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Vector e.g. [0.1,0.2,0.3]" />
                </div>
                <Button variant="outline" onClick={searchMemory} disabled={!token || loadingMemory} className="mt-3 w-full gap-2">
                  {loadingMemory ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  Search Memory
                </Button>
              </div>
            </div>
          </div>

          {message ? <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}

          <div className="grid gap-3 lg:grid-cols-2">
            {anomalies.map((item) => (
              <div key={String(item.id)} className="rounded-[1.25rem] border border-border/70 bg-background/75 p-4 text-sm">
                <p className="font-semibold text-foreground">{String(item.id)}</p>
                <p className="mt-1 text-muted-foreground">Amount: {String(item.amount || "N/A")}</p>
                {item.description ? <p className="mt-1 text-muted-foreground">{String(item.description)}</p> : null}
              </div>
            ))}
            {!anomalies.length ? <div className="rounded-[1.25rem] border border-dashed border-border bg-background/75 px-4 py-8 text-center text-sm text-muted-foreground lg:col-span-2">Anomaly or memory results will appear here.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
