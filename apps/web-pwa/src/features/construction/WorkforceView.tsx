// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HardHat, Pencil, Trash2, Users, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero, SectionHeader } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { WorkerLogsFeature } from "@/features/construction/worker_logs/WorkerLogsFeature";
import { ProjectFilesPanel } from "@/components/ui/ProjectFilesPanel";
import { exportCSV } from "@/lib/exportCSV";
import { exportHTML } from "@/lib/exportHTML";
import { createClient } from "@/lib/supabase/client";

type WorkerRow = {
  id: string;
  worker_name: string;
  role: string;
  attendance_status: string;
  daily_wage: number;
  paid_amount: number;
  unpaid_balance: number;
  work_date: string;
};

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  Present: "bg-emerald-500",
  Absent: "bg-rose-500",
  Half: "bg-amber-500",
};

export function WorkforceView() {
  const supabase = useMemo(() => createClient(), []);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Log Entry");
  const [editTarget, setEditTarget] = useState<WorkerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [editForm, setEditForm] = useState({
    worker_name: "", role: "", attendance_status: "Present", daily_wage: 0, paid_amount: 0,
  });

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("worker_logs")
      .select("id,worker_name,role,attendance_status,daily_wage,paid_amount,unpaid_balance,work_date")
      .order("work_date", { ascending: false })
      .limit(40);
    setWorkers((data as WorkerRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadWorkers();
  }, [loadWorkers]);

  const stats = useMemo(() => {
    const present = workers.filter((w) => w.attendance_status === "Present").length;
    const totalUnpaid = workers.reduce((s, w) => s + Number(w.unpaid_balance || 0), 0);
    const totalPaid = workers.reduce((s, w) => s + Number(w.paid_amount || 0), 0);
    return { present, totalUnpaid, totalPaid, total: workers.length };
  }, [workers]);

  const buildExportRows = useCallback(() => {
    return workers.map((w) => ({
      workerName: w.worker_name,
      role: w.role,
      date: w.work_date,
      attendance: w.attendance_status,
      dailyWage: Number(w.daily_wage || 0),
      paidAmount: Number(w.paid_amount || 0),
      unpaidBalance: Number(w.unpaid_balance || 0),
    }));
  }, [workers]);

  const handleEditOpen = (w: WorkerRow) => {
    setEditForm({
      worker_name: w.worker_name,
      role: w.role,
      attendance_status: w.attendance_status,
      daily_wage: Number(w.daily_wage),
      paid_amount: Number(w.paid_amount),
    });
    setEditTarget(w);
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setMutationError("");
    const { error } = await supabase.from("worker_logs").update({
      worker_name: editForm.worker_name,
      role: editForm.role,
      attendance_status: editForm.attendance_status,
      daily_wage: editForm.daily_wage,
      paid_amount: editForm.paid_amount,
    }).eq("id", editTarget.id);
    setSaving(false);
    if (error) { setMutationError(error.message); return; }
    setEditTarget(null);
    await loadWorkers();
  };

  const handleDeleteWorker = async () => {
    if (!deleteTarget) return;
    setMutationError("");
    const { error } = await supabase.from("worker_logs").delete().eq("id", deleteTarget);
    if (error) { setMutationError(error.message); return; }
    setDeleteTarget(null);
    await loadWorkers();
  };

  const tabs = ["Log Entry", "Attendance", "Payments", "Files"];

  return (
    <div className="glass rounded-2xl space-y-4">
      <WorkspaceHero
        badge="Workforce"
        stats={[
          { label: "Present Today", value: String(stats.present) },
          { label: "Total Unpaid", value: fmt(stats.totalUnpaid) },
          { label: "Total Paid", value: fmt(stats.totalPaid) },
        ]}
      />

      <div className="flex justify-end px-4 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <ExportPDFButton
            onBuildOptions={() => ({
            moduleName: "Workforce",
            moduleNameBn: "শ্রমিক ব্যবস্থাপনা",
            description: "Daily worker log with attendance status, wages, and payment records.",
            descriptionBn: "প্রতিদিনের শ্রমিক লগ — উপস্থিতি, মজুরি এবং পেমেন্ট রেকর্ড।",
            sections: [
              {
                title: "Workforce Overview",
                titleBn: "শ্রমিক সারসংক্ষেপ",
                rows: [
                  { label: "Total Workers Logged", labelBn: "মোট শ্রমিক", value: String(stats.total) },
                  { label: "Present", labelBn: "উপস্থিত", value: String(stats.present) },
                  { label: "Total Paid", labelBn: "পরিশোধিত মজুরি", value: fmt(stats.totalPaid) },
                  { label: "Total Unpaid", labelBn: "বকেয়া মজুরি", value: fmt(stats.totalUnpaid) },
                ],
              },
              {
                title: "Worker Attendance Register",
                titleBn: "শ্রমিক উপস্থিতি রেজিস্টার",
                rows: [],
                tableHeaders: ["Worker Name", "Role", "Date", "Status", "Wage"],
                tableHeadersBn: ["শ্রমিকের নাম", "পদ", "তারিখ", "উপস্থিতি", "মজুরি"],
                tableRows: workers.slice(0, 25).map((w) => [
                  w.worker_name,
                  w.role,
                  w.work_date,
                  w.attendance_status,
                  fmt(w.daily_wage),
                ]),
              },
            ],
            })}
          />
          <Button
            variant="outline"
            onClick={() => {
              const rows = buildExportRows();
              exportCSV("workforce-report.csv", rows);
            }}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const rows = buildExportRows();
              exportHTML({ title: "Workforce Report", titleBn: "শ্রমিক রিপোর্ট", rows });
            }}
          >
            HTML
          </Button>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "Log Entry" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <HardHat className="h-4 w-4 text-primary" />
              Daily Worker Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkerLogsFeature />
          </CardContent>
        </Card>
      )}

      {activeTab === "Attendance" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Attendance Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : workers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No records found. Start logging workers above.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Worker</Th>
                      <Th>Role</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th>Wage</Th>
                      <Th className="w-20 text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w.id}>
                        <Td>{w.worker_name}</Td>
                        <Td className="text-xs text-muted-foreground">{w.role}</Td>
                        <Td className="text-xs">{w.work_date}</Td>
                        <Td>
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[w.attendance_status] ?? "bg-muted"}`} />
                            <span className="text-xs">{w.attendance_status}</span>
                          </span>
                        </Td>
                        <Td className="text-xs">{fmt(Number(w.daily_wage))}</Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditOpen(w)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(w.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Payments" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              Payment Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : workers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No payment records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Worker</Th>
                      <Th>Date</Th>
                      <Th>Paid</Th>
                      <Th>Unpaid</Th>
                      <Th className="w-20 text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w.id}>
                        <Td>{w.worker_name}</Td>
                        <Td className="text-xs">{w.work_date}</Td>
                        <Td className="text-xs text-emerald-600">{fmt(Number(w.paid_amount))}</Td>
                        <Td className="text-xs text-rose-500">{fmt(Number(w.unpaid_balance))}</Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditOpen(w)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(w.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Files" && (
        <ProjectFilesPanel
          module="workforce"
          category="work-proof"
          label="Work Proof & Attendance Files"
        />
      )}

      {editTarget && (
        <Dialog open title="Edit Worker Log" onClose={() => setEditTarget(null)}>
          <div className="space-y-3">
            <div>
              <label htmlFor="worker-edit-name" className="mb-1 block text-xs text-muted-foreground">Worker Name</label>
              <input id="worker-edit-name" type="text" value={editForm.worker_name}
                onChange={(e) => setEditForm((f) => ({ ...f, worker_name: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            <div>
              <label htmlFor="worker-edit-role" className="mb-1 block text-xs text-muted-foreground">Role</label>
              <input id="worker-edit-role" type="text" value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            <div>
              <label htmlFor="worker-edit-status" className="mb-1 block text-xs text-muted-foreground">Attendance Status</label>
              <select id="worker-edit-status" value={editForm.attendance_status}
                onChange={(e) => setEditForm((f) => ({ ...f, attendance_status: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half">Half</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="worker-edit-daily-wage" className="mb-1 block text-xs text-muted-foreground">Daily Wage</label>
                <input id="worker-edit-daily-wage" type="number" value={editForm.daily_wage}
                  onChange={(e) => setEditForm((f) => ({ ...f, daily_wage: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
              </div>
              <div>
                <label htmlFor="worker-edit-paid-amount" className="mb-1 block text-xs text-muted-foreground">Paid Amount</label>
                <input id="worker-edit-paid-amount" type="number" value={editForm.paid_amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, paid_amount: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
              </div>
            </div>
            {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleEditSubmit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            </div>
          </div>
        </Dialog>
      )}

      {deleteTarget && (
        <Dialog open title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this worker log? This action cannot be undone.</p>
          {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
          <div className="flex gap-2">
            <Button onClick={handleDeleteWorker}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
