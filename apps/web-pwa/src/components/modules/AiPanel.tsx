"use client";

import { useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AiPanel() {
  const token = useAuthStore((s) => s.token);
  const [vector, setVector] = useState("[0.01,0.02,0.03]");
  const [anomalies, setAnomalies] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState("");

  const loadAnomalies = async () => {
    if (!token) return;
    try {
      const rows = await apiRequest<Array<Record<string, unknown>>>("/ai/anomalies", {}, token);
      setAnomalies(rows);
      setMessage(`Loaded ${rows.length} anomalies`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const searchMemory = async () => {
    if (!token) return;
    try {
      const rows = await apiRequest<Array<Record<string, unknown>>>(`/ai/memory/search?vector=${encodeURIComponent(vector)}`, {}, token);
      setMessage(`Memory hits: ${rows.length}`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h2>Sumonix AI</h2>
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
