import { useState } from "react";

import { apiRequest } from "@/lib/api";

export function useWorkers() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const saveWorkerLog = async (payload) => {
    try {
      setLoading(true);
      const response = await apiRequest("/api/construction/attendance", {
        method: "POST",
        body: JSON.stringify({
          worker_id: payload.worker_name,
          latitude: payload.latitude,
          longitude: payload.longitude,
        }),
      });
      setMessage(`Worker log synced (${response.message || "ok"})`);
      return true;
    } catch (error) {
      setMessage(error.message || "Worker log failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, message, saveWorkerLog };
}
