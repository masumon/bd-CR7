import { useState } from "react";

import { apiRequest } from "@/lib/api";

type AttendancePayload = {
  worker_id: string;
  latitude: number;
  longitude: number;
};

type AttendanceResponse = {
  message?: string;
  distance_km?: number;
};

type UseWorkersReturn = {
  loading: boolean;
  message: string;
  saveWorkerLog: (payload: AttendancePayload) => Promise<boolean>;
};

export function useWorkers(): UseWorkersReturn {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const saveWorkerLog = async (payload: AttendancePayload): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiRequest<AttendanceResponse>("/api/construction/attendance", {
        method: "POST",
        body: JSON.stringify({
          worker_id: payload.worker_id,
          latitude: payload.latitude,
          longitude: payload.longitude,
        }),
      });
      setMessage(`Worker log synced (${response.message ?? "ok"})`);
      return true;
    } catch (err) {
      setMessage((err as Error).message || "Worker log failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, message, saveWorkerLog };
}
