"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeDollarSign, FileSearch, ShieldCheck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
import { createClient } from "@/lib/supabase/client";

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

  const tabs = ["Activity Logs", "Financial Audit", "System Changes"];

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Audit"
        title="System Audit Trail"
        description="Complete record of all system changes, financial activity and user actions"
        stats={[
          { label: "Total Events", value: String(stats.total) },
          { label: "Inserts", value: String(stats.inserts) },
          { label: "Updates", value: String(stats.updates) },
        ]}
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

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
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Action</Th>
                      <Th>Table</Th>
                      <Th>Record</Th>
                      <Th>By</Th>
                      <Th>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <Td>
                          <span className={`text-xs font-semibold ${ACTION_COLORS[log.action] ?? "text-foreground"}`}>
                            {log.action}
                          </span>
                        </Td>
                        <Td className="text-xs text-muted-foreground">{log.table_name || "—"}</Td>
                        <Td className="max-w-[80px] truncate font-mono text-[10px] text-muted-foreground">{log.record_id || "—"}</Td>
                        <Td className="max-w-[80px] truncate font-mono text-[10px] text-muted-foreground">{log.changed_by || "system"}</Td>
                        <Td className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
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
                {auditLogs
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
    </div>
  );
}
