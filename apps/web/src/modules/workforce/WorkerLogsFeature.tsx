// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { apiRequest } from "@/lib/api";
import { isQueuedApiResult } from "@/lib/apiClient";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errorUtils";
import { EvidenceGate, type EvidenceGateFileReady } from "@/components/ui/EvidenceGate";

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
  const toast = useToast();

  const [workerName, setWorkerName]               = useState("");
  const [phone, setPhone]                         = useState("");
  const [role, setRole]                           = useState<(typeof ROLES)[number]>("General Labour");
  const [dailyWage, setDailyWage]                 = useState("0");
  const [attendanceStatus, setAttendanceStatus]   = useState<(typeof ATTENDANCE)[number]>("Present");
  const [paidAmount, setPaidAmount]               = useState("0");
  const [workDescription, setWorkDescription]     = useState("");
  const [latitude, setLatitude]                   = useState("23.777176");
  const [longitude, setLongitude]                 = useState("90.399452");

  // Work proof (warn severity — not a hard block)
  const [proofFileId, setProofFileId] = useState<string | null>(null);

  const [logs, setLogs]               = useState<AttendanceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logQuery, setLogQuery]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "half">("all");

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

  const filteredLogs = useMemo(() => {
    const normalized = logQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const status = String(log.status).toLowerCase() as "present" | "absent" | "half";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!normalized) return true;
      const haystack = [log.worker_name, log.role, log.phone || "", log.work_description || "", log.date, status]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [logs, logQuery, statusFilter]);

  const handleFileReady = ({ fileId }: EvidenceGateFileReady) => {
    setProofFileId(fileId);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const statusLower = attendanceStatus.toLowerCase() as "present" | "absent" | "half";

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
        proof_file_id:    proofFileId || null,
      });
      if (error) throw error;
      toast.success("Worker log saved", `${workerName} — ${attendanceStatus}${proofFileId ? " · Proof attached" : ""}`);
      setWorkerName(""); setPhone(""); setWorkDescription(""); setPaidAmount("0");
      setProofFileId(null);
      fetchLogs();
      return;
    } catch (_) {
      // fallback to Python API
    }

    try {
      const result = await apiRequest<{ message?: string }>("/api/construction/attendance", {
        method: "POST",
        body: JSON.stringify({ worker_id: workerName, latitude: Number(latitude), longitude: Number(longitude) }),
      });
      if (isQueuedApiResult(result)) {
        toast.warning("Worker log queued", "Saved offline. The attendance log will sync automatically when internet returns.");
        return;
      }
      toast.info("Worker log synced", result.message || "API fallback used");
      fetchLogs();
    } catch (err) {
      toast.error("Failed to save worker log", getErrorMessage(err));
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
      <section className="module app-panel module-surface rounded-[1.25rem] p-4 shadow-soft space-y-4 sm:p-5">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Worker & HR</h3>
          <p className="mt-1 text-sm text-muted-foreground">Track attendance, wage exposure, and geofence compliance.</p>
        </div>

        {/* Work proof (warn severity — recommended but not blocking) */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Work Proof (Recommended)
          </p>
          <EvidenceGate
            module="workforce"
            category="work-proof"
            severity="warn"
            label="Attach a work photo or timesheet for this attendance log."
            onFileReady={handleFileReady}
            onCleared={() => setProofFileId(null)}
          />
        </div>

        <form onSubmit={onSubmit} className="app-form-grid md:grid-cols-2">
          <input className="app-field" value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Worker Name" required />
          <input className="app-field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
          <select className="app-select" title="Role" value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input className="app-field" type="number" min="0" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} placeholder="Daily Wage (৳)" required />
          <select className="app-select" title="Attendance status" value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value as (typeof ATTENDANCE)[number])}>
            {ATTENDANCE.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input className="app-field" type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Paid Amount (৳)" required />
          <textarea className="app-textarea md:col-span-2" rows={2} value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder="Work description (optional)" />
          <input className="app-field" type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" />
          <input className="app-field" type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" />

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
          <button
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 md:col-span-2"
            type="submit"
          >
            Save Worker Log / শ্রমিক লগ সেভ করুন
            {proofFileId && <span className="ml-2 text-[11px] opacity-75">· Proof attached ✓</span>}
          </button>
        </form>
      </section>

      {/* Attendance Log Table */}
      <section className="app-panel module-surface rounded-[1.25rem] p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">সাম্প্রতিক উপস্থিতি / Recent Attendance</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Last 50 entries</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fetchLogs()} disabled={logsLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-50" aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
            </button>
            <button type="button"
              onClick={() =>
                downloadCSV(`worker-attendance-${new Date().toISOString().slice(0, 10)}.csv`,
                  filteredLogs.map((l) => ({
                    date: l.date, name: l.worker_name, role: l.role, status: l.status,
                    daily_wage: l.daily_wage, paid: l.paid_amount,
                    unpaid: Math.max(0, l.daily_wage * (l.status === "present" ? 1 : l.status === "half" ? 0.5 : 0) - l.paid_amount),
                    phone: l.phone ?? "", description: l.work_description ?? "",
                  }))
                )
              }
              disabled={!filteredLogs.length}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50">
              <ArrowDownToLine className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={logQuery}
            onChange={(e) => setLogQuery(e.target.value)}
            placeholder="Search by worker, role, phone..."
            className="h-9 min-w-0 w-full flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none sm:min-w-[230px]"
          />
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
            {([
              ["all", "All"],
              ["present", "Present"],
              ["half", "Half"],
              ["absent", "Absent"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${statusFilter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {logsLoading ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
        ) : !filteredLogs.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/75 px-4 py-8 text-center text-sm text-muted-foreground">
            বর্তমান ফিল্টারে কোনো লগ পাওয়া যায়নি।
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
                {filteredLogs.map((log) => (
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
