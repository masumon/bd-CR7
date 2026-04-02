"use client";

import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function ConstructionPanel() {
  const token = useAuthStore((s) => s.token);
  const [workerId, setWorkerId] = useState("");
  const [lat, setLat] = useState("23.777176");
  const [lng, setLng] = useState("90.399452");
  const [message, setMessage] = useState("");

  const markAttendance = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      const result = await apiRequest<{ message: string; distance_km: number }>(
        "/api/construction/attendance",
        {
          method: "POST",
          body: JSON.stringify({ worker_id: workerId, latitude: Number(lat), longitude: Number(lng) }),
        },
        token
      );
      setMessage(`${result.message} (${result.distance_km} km)`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h2>Construction</h2>
      <form onSubmit={markAttendance} className="formGrid">
        <input value={workerId} onChange={(e) => setWorkerId(e.target.value)} placeholder="Worker ID" />
        <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" />
        <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" />
        <button type="submit" disabled={!token}>Mark attendance</button>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
