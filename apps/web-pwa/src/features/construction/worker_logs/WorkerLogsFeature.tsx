"use client";

import { FormEvent, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";

const ATTENDANCE = ["Present", "Absent", "Half"] as const;

export function WorkerLogsFeature() {
  const [workerName, setWorkerName] = useState("");
  const [role, setRole] = useState("Worker");
  const [dailyWage, setDailyWage] = useState("0");
  const [attendanceStatus, setAttendanceStatus] = useState<(typeof ATTENDANCE)[number]>("Present");
  const [paidAmount, setPaidAmount] = useState("0");
  const [latitude, setLatitude] = useState("23.777176");
  const [longitude, setLongitude] = useState("90.399452");

  const [message, setMessage] = useState("");

  const unpaidBalance = useMemo(() => {
    const wage = Number(dailyWage || 0);
    const paid = Number(paidAmount || 0);
    const attendanceFactor = attendanceStatus === "Present" ? 1 : attendanceStatus === "Half" ? 0.5 : 0;
    const billable = wage * attendanceFactor;
    return Math.max(0, billable - paid);
  }, [dailyWage, paidAmount, attendanceStatus]);

  const geoDistanceKm = useMemo(() => {
    const siteLat = 23.777176;
    const siteLng = 90.399452;
    const dLat = (Number(latitude) - siteLat) * (Math.PI / 180);
    const dLng = (Number(longitude) - siteLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(siteLat * (Math.PI / 180)) * Math.cos(Number(latitude) * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  }, [latitude, longitude]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await apiRequest<{ message?: string }>(
        "/api/construction/attendance",
        {
          method: "POST",
          body: JSON.stringify({
            worker_id: workerName,
            latitude: Number(latitude),
            longitude: Number(longitude),
          }),
        }
      );
      setMessage(result.message || "Worker log synced");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h3>Worker & HR</h3>
      <form onSubmit={onSubmit} className="formGrid">
        <input value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Worker Name" required />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" required />
        <input type="number" min="0" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} placeholder="Daily Wage" required />
        <select value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value as (typeof ATTENDANCE)[number])}>
          {ATTENDANCE.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Paid Amount" required />
        <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" />
        <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" />

        <p className="text-xs text-slate-600">Unpaid Balance: {unpaidBalance.toFixed(2)}</p>
        <p className="text-xs text-slate-600">Geofenced Attendance: {geoDistanceKm <= 0.5 ? "Inside" : "Outside"} ({geoDistanceKm.toFixed(2)} km)</p>
        <button type="submit">Save Worker Log</button>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
