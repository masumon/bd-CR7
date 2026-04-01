"use client";

import { useState } from "react";

import { useAuthStore } from "@/store/authStore";

export function AiPanel() {
  const token = useAuthStore((s) => s.token);
  const [vector, setVector] = useState("[0.01,0.02,0.03]");
  const [anomalies, setAnomalies] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState("");

  const loadAnomalies = async () => {
    if (!token) return;
    setAnomalies([]);
    setMessage("AI anomaly API requires backend deployment. Supabase-only mode is active.");
  };

  const searchMemory = async () => {
    if (!token) return;
    setMessage("AI memory search requires backend deployment. Supabase-only mode is active.");
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
