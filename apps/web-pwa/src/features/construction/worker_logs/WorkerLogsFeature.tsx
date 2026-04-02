"use client";

import { FormEvent, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { apiRequest } from "@/lib/api";

const ROLES = [
  "Brick Mason", "Iron Worker", "Steel Fabricator", "Welder",
  "Electrician", "Plumber", "Painter", "Carpenter",
  "General Labour", "Supervisor", "Engineer", "Security Guard",
] as const;

const ATTENDANCE = ["Present", "Absent", "Half"] as const;

export function WorkerLogsFeature() {
  const supabase = createClient();

  const [workerName, setWorkerName]         = useState("");
  const [phone, setPhone]                   = useState("");
  const [role, setRole]                     = useState<(typeof ROLES)[number]>("General Labour");
  const [dailyWage, setDailyWage]           = useState("0");
  const [attendanceStatus, setAttendanceStatus] = useState<(typeof ATTENDANCE)[number]>("Present");
  const [paidAmount, setPaidAmount]         = useState("0");
  const [workDescription, setWorkDescription] = useState("");
  const [latitude, setLatitude]             = useState("23.777176");
  const [longitude, setLongitude]           = useState("90.399452");
  const [message, setMessage]               = useState("");

  const unpaidBalance = useMemo(() => {
    const wage = Number(dailyWage || 0);
    const paid = Number(paidAmount || 0);
    const attendanceFactor = attendanceStatus === "Present" ? 1 : attendanceStatus === "Half" ? 0.5 : 0;
    return Math.max(0, wage * attendanceFactor - paid);
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

    const today = new Date().toISOString().slice(0, 10);
    const statusLower = attendanceStatus.toLowerCase() as "present" | "absent" | "half";

    // Try Supabase first
    try {
      const { error } = await supabase.from("attendance").insert({
        worker_name:      workerName.trim(),
        phone:            phone.trim() || null,
        role,
        status:           statusLower,
        daily_wage:       Number(dailyWage),
        paid_amount:      Number(paidAmount),
        work_description: workDescription.trim() || null,
        date:             today,
        latitude:         Number(latitude),
        longitude:        Number(longitude),
      });
      if (error) throw error;
      setMessage("Worker log saved successfully.");
      setWorkerName(""); setPhone(""); setWorkDescription(""); setPaidAmount("0");
      return;
    } catch (_) {
      // fallback to Python API
    }

    try {
      const result = await apiRequest<{ message?: string }>("/api/construction/attendance", {
        method: "POST",
        body: JSON.stringify({ worker_id: workerName, latitude: Number(latitude), longitude: Number(longitude) }),
      });
      setMessage(result.message || "Worker log synced (API fallback)");
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">Worker & HR</h3>
        <p className="mt-1 text-sm text-muted-foreground">Track attendance, wage exposure, and geofence compliance with clearer grouped fields.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Worker Name" required />
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
          <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Role" value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} placeholder="Daily Wage (৳)" required />
          <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Attendance status" value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value as (typeof ATTENDANCE)[number])}>
            {ATTENDANCE.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Paid Amount (৳)" required />
          <textarea className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none md:col-span-2 resize-none" rows={2} value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder="Work description (optional)" />
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" />
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" />

        <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.14em]">Unpaid Balance</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{unpaidBalance.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.14em]">Geofence Status</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{geoDistanceKm <= 0.5 ? "Inside" : "Outside"}</p>
          <p className="mt-1 text-xs">{geoDistanceKm.toFixed(2)} km from site</p>
        </div>
        <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 md:col-span-2" type="submit">Save Worker Log</button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
