"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { apiRequest } from "@/lib/api";

const ROLES = [
  "Brick Mason", "Iron Worker", "Steel Fabricator", "Welder",
  "Electrician", "Plumber", "Painter", "Carpenter",
  "General Labour", "Supervisor", "Engineer", "Security Guard",
] as const;

const ATTENDANCE = ["Present", "Absent", "Half"] as const;

interface AttendanceLog {
  id: string;
  worker_name: string;
  phone?: string;
  role: string;
  status: string;
  daily_wage: number;
  paid_amount: number;
  date: string;
  work_description?: string;
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = String(r[h] ?? "");
        return val.includes(",") || val.includes('"') ? `"${val.replaceAll('"', '""')}"` : val;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function WorkerLogsFeature() {
  const supabase = useMemo(() => createClient(), []);

  // --- Form state ---
  const [workerName, setWorkerName]               = useState("");
  const [phone, setPhone]                         = useState("");
  const [role, setRole]                           = useState<(typeof ROLES)[number]>("General Labour");
  const [dailyWage, setDailyWage]                 = useState("0");
  const [attendanceStatus, setAttendanceStatus]   = useState<(typeof ATTENDANCE)[number]>("Present");
  const [paidAmount, setPaidAmount]               = useState("0");
  const [workDescription, setWorkDescription]     = useState("");
  const [latitude, setLatitude]                   = useState("23.777176");
  const [longitude, setLongitude]                 = useState("90.399452");
  const [message, setMessage]                     = useState("");

  // --- Log list state ---
  const [logs, setLogs]       = useState<AttendanceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from("attendance")
        .select("id,worker_name,phone,role,status,daily_wage,paid_amount,date,work_description")
        .order("date", { ascending: false })
        .limit(50);
      setLogs((data as AttendanceLog[]) || []);
    } catch {
      // silently fail — list is supplemental
    } finally {
      setLogsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

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
      setMessage("✅ Worker log saved.");
      setWorkerName(""); setPhone(""); setWorkDescription(""); setPaidAmount("0");
      fetchLogs(); // refresh list
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
      fetchLogs();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const statusColor = (s: string) => {
    if (s === "present") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "absent")  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };

  return (
    <div className="space-y-5">
      {/* Entry Form */}
      <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-foreground">Worker & HR</h3>
          <p className="mt-1 text-sm text-muted-foreground">Track attendance, wage exposure, and geofence compliance.</p>
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
            <p className="mt-2 text-xl font-semibold text-foreground">৳{unpaidBalance.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground">
            <p className="text-xs uppercase tracking-[0.14em]">Geofence Status</p>
            <p className={`mt-2 text-xl font-semibold ${geoDistanceKm <= 0.5 ? "text-emerald-600" : "text-rose-600"}`}>
              {geoDistanceKm <= 0.5 ? "Inside" : "Outside"}
            </p>
            <p className="mt-1 text-xs">{geoDistanceKm.toFixed(2)} km from site</p>
          </div>
          <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 md:col-span-2" type="submit">
            Save Worker Log / শ্রমিক লগ সেভ করুন
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </section>

      {/* Attendance Log Table */}
      <section className="rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">সাম্প্রতিক উপস্থিতি / Recent Attendance</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Last 50 entries</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLogs()}
              disabled={logsLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  `worker-attendance-${new Date().toISOString().slice(0, 10)}.csv`,
                  logs.map((l) => ({
                    date: l.date,
                    name: l.worker_name,
                    role: l.role,
                    status: l.status,
                    daily_wage: l.daily_wage,
                    paid: l.paid_amount,
                    unpaid: Math.max(0, l.daily_wage * (l.status === "present" ? 1 : l.status === "half" ? 0.5 : 0) - l.paid_amount),
                    phone: l.phone ?? "",
                    description: l.work_description ?? "",
                  }))
                )
              }
              disabled={!logs.length}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        {logsLoading ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
        ) : !logs.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/75 px-4 py-8 text-center text-sm text-muted-foreground">
            কোনো লগ পাওয়া যায়নি। শ্রমিক লগ যোগ করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-4 whitespace-nowrap">তারিখ</th>
                  <th className="py-2 pr-4 whitespace-nowrap">শ্রমিক</th>
                  <th className="py-2 pr-4 whitespace-nowrap">রোল</th>
                  <th className="py-2 pr-4 whitespace-nowrap">স্ট্যাটাস</th>
                  <th className="py-2 pr-4 whitespace-nowrap">মজুরি</th>
                  <th className="py-2 whitespace-nowrap">পরিশোধিত</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{log.date}</td>
                    <td className="py-2 pr-4 font-medium text-foreground">{log.worker_name}</td>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">{log.role}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusColor(log.status)}`}>
                        {log.status === "present" ? "উপস্থিত" : log.status === "absent" ? "অনুপস্থিত" : "অর্ধদিন"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">৳{Number(log.daily_wage).toLocaleString()}</td>
                    <td className="py-2 text-muted-foreground">৳{Number(log.paid_amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
