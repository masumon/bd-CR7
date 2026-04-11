"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeDollarSign, FileSearch, Search, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { ModulePageHeader } from "@/components/ui/ModulePageHeader";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ProjectFilesPanel } from "@/components/ui/ProjectFilesPanel";
import { createClient } from "@/lib/supabase/client";
import { AuditViewer } from "@/modules/_shared";

type AuditRow = {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  changed_by: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

type ExpenseAuditRow = {
  id: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "text-emerald-500",
  UPDATE: "text-amber-500",
  DELETE: "text-rose-500",
};

export function AuditView() {
  const supabase = useMemo(() => createClient(), []);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Activity Logs");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"ALL" | "INSERT" | "UPDATE" | "DELETE">("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [auditRes, expenseRes] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("id,action,table_name,record_id,changed_by,old_data,new_data,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("expenses")
          .select("id,amount,status,description,created_at")
          .order("created_at", { ascending: false })
          .limit(40),
      ]);
      setAuditLogs((auditRes.data as AuditRow[]) || []);
      setExpenses((expenseRes.data as ExpenseAuditRow[]) || []);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const stats = useMemo(() => {
    const inserts = auditLogs.filter((l) => l.action === "INSERT").length;
    const updates = auditLogs.filter((l) => l.action === "UPDATE").length;
    const deletes = auditLogs.filter((l) => l.action === "DELETE").length;
    return { total: auditLogs.length, inserts, updates, deletes };
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (log.action?.toLowerCase().includes(q)) ||
          (log.table_name?.toLowerCase().includes(q)) ||
          (log.record_id?.toLowerCase().includes(q)) ||
          (log.changed_by?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, search, actionFilter]);

  const tabs = ["Activity Logs", "Financial Audit", "System Changes", "File Audit"];

  const exportActions = (
    <ExportPDFButton
      onBuildOptions={() => ({
        moduleName: "Audit Trail",
        moduleNameBn: "অডিট ট্রেইল",
        description: "Complete audit log of all system actions, database changes, and financial events.",
        descriptionBn: "সমস্ত সিস্টেম কার্যক্রম, ডেটাবেস পরিবর্তন এবং আর্থিক ঘটনার সম্পূর্ণ অডিট লগ।",
        sections: [
          {
            title: "Audit Summary",
            titleBn: "অডিট সারসংক্ষেপ",
            rows: [
              { label: "Total Events", labelBn: "মোট ঘটনা", value: String(stats.total) },
              { label: "INSERT Events", labelBn: "নতুন রেকর্ড", value: String(stats.inserts) },
              { label: "UPDATE Events", labelBn: "আপডেট রেকর্ড", value: String(stats.updates) },
              { label: "DELETE Events", labelBn: "মুছে ফেলা রেকর্ড", value: String(stats.deletes) },
            ],
          },
          {
            title: "Activity Log",
            titleBn: "কার্যক্রম লগ",
            rows: [],
            tableHeaders: ["Action", "Table", "Record ID", "Changed By", "Time"],
            tableHeadersBn: ["কার্যক্রম", "টেবিল", "রেকর্ড আইডি", "পরিবর্তনকারী", "সময়"],
            tableRows: auditLogs.slice(0, 20).map((log) => [
              log.action, log.table_name ?? "—",
              log.record_id ? log.record_id.slice(0, 8) : "—",
              log.changed_by ?? "system",
              new Date(log.created_at).toLocaleString(),
            ]),
          },
          {
            title: "Financial Audit",
            titleBn: "আর্থিক অডিট",
            rows: [],
            tableHeaders: ["Date", "Amount", "Status", "Description"],
            tableHeadersBn: ["তারিখ", "পরিমাণ", "স্ট্যাটাস", "বিবরণ"],
            tableRows: expenses.slice(0, 20).map((e) => [
              e.created_at?.slice(0, 10) ?? "—",
              `৳${Number(e.amount || 0).toLocaleString("en-BD")}`,
              e.status === "approved" ? "✓ অনুমোদিত" : "⏳ বাকি",
              e.description ?? "—",
            ]),
          },
        ],
      })}
    />
  );

  return (
    <div className="space-y-4">
      <ModulePageHeader
        icon={ShieldCheck}
        title="Audit"
        titleBn="অডিট ট্রেইল"
        theme="audit"
        actions={exportActions}
        stats={[
          { label: "Total", labelBn: "মোট ঘটনা", value: stats.total, color: "default" },
          { label: "Inserts", labelBn: "নতুন রেকর্ড", value: stats.inserts, color: "green" },
          { label: "Updates", labelBn: "আপডেট", value: stats.updates, color: "amber" },
          { label: "Deletes", labelBn: "মুছে ফেলা", value: stats.deletes, color: "rose" },
        ]}
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 min-w-[160px]">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "INSERT", "UPDATE", "DELETE"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setActionFilter(a)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                actionFilter === a
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Activity Logs" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No audit logs yet. Actions will appear here as the system is used.</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No results match your search.</p>
            ) : (
              <AuditViewer
                items={filteredLogs.map((log) => ({
                  id: log.id,
                  action: `${log.action}${log.table_name ? ` · ${log.table_name}` : ""}`,
                  actor: log.changed_by,
                  timestamp: log.created_at,
                  summary: log.record_id ? `Record: ${log.record_id}` : null,
                }))}
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Financial Audit" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BadgeDollarSign className="h-4 w-4 text-primary" />
              Financial Audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : expenses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No financial records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Description</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <Td className="max-w-[140px] truncate text-xs">{e.description || "—"}</Td>
                        <Td className="text-xs font-medium">৳{Number(e.amount).toLocaleString()}</Td>
                        <Td>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              e.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {e.status}
                          </span>
                        </Td>
                        <Td className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "System Changes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileSearch className="h-4 w-4 text-primary" />
              System Change Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : auditLogs.filter((l) => l.action === "UPDATE" || l.action === "DELETE").length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No system changes recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {filteredLogs
                  .filter((l) => l.action === "UPDATE" || l.action === "DELETE")
                  .map((log) => (
                    <div key={log.id} className="rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${ACTION_COLORS[log.action] ?? ""}`}>{log.action}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Table: <strong className="text-foreground">{log.table_name}</strong>
                        {log.changed_by ? ` · By: ${log.changed_by}` : ""}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "File Audit" && (
        <ProjectFilesPanel
          module="audit"
          category="general"
          label="Audit Documents & Evidence Files"
        />
      )}
    </div>
  );
}
