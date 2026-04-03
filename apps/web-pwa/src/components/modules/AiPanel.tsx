"use client";

import { useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AiPanel() {
  const token = useAuthStore((s) => s.token);
  const [vector, setVector] = useState("[0.01,0.02,0.03]");
  const [anomalies, setAnomalies] = useState<Array<Record<string, unknown>>>([]);
  const [answer, setAnswer] = useState("");
  const [prompt, setPrompt] = useState("Dashboard summary");
  const [message, setMessage] = useState("");

  const loadAnomalies = async () => {
    if (!token) {
      setMessage("Login required.");
      return;
    }
    setMessage("");
    try {
      const data = await apiRequest<Array<Record<string, unknown>>>("/api/ai/anomalies", {}, token);
      setAnomalies(data || []);
      if (!data?.length) {
        setMessage("No anomalies detected.");
      }
    } catch (err) {
      setMessage((err as Error).message || "Failed to load anomalies.");
    }
  };

  const searchMemory = async () => {
    if (!token) {
      setMessage("Login required.");
      return;
    }
    setMessage("");
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
    }
  };

  const askAi = async () => {
    if (!token) {
      setMessage("Login required.");
      return;
    }
    setMessage("");
    setAnswer("");
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
    }
  };

  return (
    <section className="module">
      <h2>Sumonix AI</h2>
      {!token ? <p>Please login to activate AI tools.</p> : null}
      <div className="formGrid mb-2.5">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask SUMONIX..." />
        <button onClick={askAi} disabled={!token}>Ask AI</button>
      </div>
      {answer ? <p className="whitespace-pre-wrap">{answer}</p> : null}
      <div className="formGrid">
        <button onClick={loadAnomalies} disabled={!token}>Load anomalies</button>
        <input value={vector} onChange={(e) => setVector(e.target.value)} placeholder="Vector e.g. [0.1,0.2,...]" />
        <button onClick={searchMemory} disabled={!token}>Search memory</button>
      </div>
      {message ? <p>{message}</p> : null}
      <ul>
        {anomalies.map((item) => (
          <li key={String(item.id)}>{String(item.id)} - {String(item.amount)}</li>
        ))}
      </ul>
    </section>
  );
}
