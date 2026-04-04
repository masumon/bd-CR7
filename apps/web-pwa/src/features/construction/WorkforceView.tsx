"use client";

import { useEffect, useMemo, useState } from "react";
import { HardHat, Users, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero, SectionHeader } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { WorkerLogsFeature } from "@/features/construction/worker_logs/WorkerLogsFeature";
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("worker_logs")
        .select("id,worker_name,role,attendance_status,daily_wage,paid_amount,unpaid_balance,work_date")
        .order("work_date", { ascending: false })
        .limit(40);
      setWorkers((data as WorkerRow[]) || []);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const stats = useMemo(() => {
    const present = workers.filter((w) => w.attendance_status === "Present").length;
    const totalUnpaid = workers.reduce((s, w) => s + Number(w.unpaid_balance || 0), 0);
    const totalPaid = workers.reduce((s, w) => s + Number(w.paid_amount || 0), 0);
    return { present, totalUnpaid, totalPaid, total: workers.length };
  }, [workers]);

  const tabs = ["Log Entry", "Attendance", "Payments"];

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
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w.id}>
                        <Td>{w.worker_name}</Td>
                        <Td className="text-xs">{w.work_date}</Td>
                        <Td className="text-xs text-emerald-600">{fmt(Number(w.paid_amount))}</Td>
                        <Td className="text-xs text-rose-500">{fmt(Number(w.unpaid_balance))}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
