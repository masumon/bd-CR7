"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, BadgeDollarSign, ClipboardCheck, MoreHorizontal, ReceiptText, WalletCards } from "lucide-react";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, Td, Th } from "@/components/ui/table";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { createClient } from "@/lib/supabase/client";
import { FundManagerFeature } from "./fund_manager/FundManagerFeature";
import { ExpenseEngineFeature } from "./expense_engine/ExpenseEngineFeature";

interface ExpenseRow {
  id: string;
  amount: number;
  status: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  receipt_url?: string | null;
}

function widthClassFromPct(pct: number): string {
  if (pct >= 90) return "w-full";
  if (pct >= 80) return "w-5/6";
  if (pct >= 70) return "w-4/5";
  if (pct >= 60) return "w-3/4";
  if (pct >= 50) return "w-2/3";
  if (pct >= 40) return "w-1/2";
  if (pct >= 30) return "w-2/5";
  if (pct >= 20) return "w-1/3";
  return "w-1/4";
}

export function FinanceExpenseView() {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("id,amount,status,description,metadata,created_at,receipt_url")
      .order("created_at", { ascending: false })
      .limit(60);
    setRows((data || []) as ExpenseRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const pendingApprovals = rows.filter((r) => String(r.status).toLowerCase() === "pending").length;
  const approvedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rows
      .filter((r) => String(r.status).toLowerCase() === "approved" && (r.created_at || "").slice(0, 10) === today)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [rows]);
  const receiptsMissing = rows.filter((r) => !r.receipt_url).length;

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const metaCategory = typeof row.metadata?.category === "string" ? row.metadata.category : "";
      const category = metaCategory || row.description?.split(" ")[0] || "General";
      totals[category] = (totals[category] || 0) + Number(row.amount || 0);
    }
    const list = Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
    const max = list[0]?.value || 1;
    return list.map((item) => {
      const widthPct = Math.max(8, Math.round((item.value / max) * 100));
      return { ...item, widthClass: widthClassFromPct(widthPct) };
    });
  }, [rows]);

  const subcategoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const subcategory = typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "General";
      totals[subcategory] = (totals[subcategory] || 0) + Number(row.amount || 0);
    }
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rows]);

  return (
    <div className="glass rounded-2xl space-y-4">
      <WorkspaceHero
        badge="Finance Workspace / তহবিল ও খরচ"
        title="Fund intake, expense categories, subcategories, and approval visibility now sit in one finance cockpit."
        description="This workspace is arranged as intake, ledger, and review so accounting actions feel sequential and readable on both desktop and mobile."
        stats={[
          { label: "Pending Approvals", value: String(pendingApprovals) },
          { label: "Approved Today", value: `৳${approvedToday.toLocaleString("en-BD")}` },
          { label: "Receipts Missing", value: String(receiptsMissing) },
        ]}
        highlights={[
          { title: "Fund Intake", description: "Client, owner, investor, and bank inflow capture", icon: WalletCards },
          { title: "Expense Engine", description: "Category and subcategory-driven expense creation", icon: ReceiptText },
          { title: "Approval Desk", description: "Checker-ready records with receipt awareness", icon: ClipboardCheck },
        ]}
      />

      <SectionHeader
        eyebrow="Ledger / লেজার"
        title="Finance records with category and subcategory"
        description="Each finance record exposes a clearer classification and quick action menu before review."
        actions={<Button onClick={() => setOpen(!open)} className="w-full sm:w-auto">{open ? "Close Forms" : "Add Fund / Expense"}</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader>
            <CardTitle>Expense Ledger</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Detailed finance entries with category, subcategory, and approval status.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Expense ID</Th>
                    <Th>Category</Th>
                    <Th>Subcategory</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th className="w-14 text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {(loading ? [] : rows).map((row) => {
                    const metaCategory = typeof row.metadata?.category === "string" ? row.metadata.category : "";
                    const metaSubcategory = typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "General";
                    const category = metaCategory || row.description?.split(" ")[0] || "General";
                    const approved = String(row.status).toLowerCase() === "approved";
                    return (
                    <tr key={row.id}>
                      <Td className="font-medium text-foreground">{row.id.slice(0, 8).toUpperCase()}</Td>
                      <Td>{category}</Td>
                      <Td>{metaSubcategory}</Td>
                      <Td>৳{Number(row.amount || 0).toLocaleString("en-BD")}</Td>
                      <Td>
                        <span className={`rounded-full px-2 py-1 text-xs ${approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {approved ? "Approved" : "Pending"}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <ActionMenu
                          items={[
                            { label: `Category: ${category}`, onClick: () => {} },
                            { label: `Subcategory: ${metaSubcategory}`, onClick: () => {} },
                            { label: `Status: ${approved ? "Approved" : "Pending"}`, onClick: () => {} },
                          ]}
                          className="ml-auto"
                        />
                      </Td>
                    </tr>
                    );
                  })}
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <Td className="text-muted-foreground" colSpan={6}>No expense records found yet.</Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(loading ? [] : categoryBreakdown).map((item) => (
              <div key={item.label} className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">৳{item.value.toLocaleString("en-BD")}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className={`h-2 rounded-full bg-primary ${item.widthClass}`} />
                </div>
              </div>
            ))}
            {!loading && categoryBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">No category data yet.</div>
            ) : null}
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Top Subcategories</p>
              <div className="mt-3 space-y-2">
                {subcategoryBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">৳{item.value.toLocaleString("en-BD")}</span>
                  </div>
                ))}
                {!subcategoryBreakdown.length ? <p className="text-sm text-muted-foreground">No subcategory data yet.</p> : null}
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              Use the expense form to keep category and receipt data complete before the checker review stage.
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Finance Actions">
        <div className="space-y-4">
          <FundManagerFeature onSaved={loadExpenses} />
          <ExpenseEngineFeature onSaved={loadExpenses} />
        </div>
      </Dialog>
    </div>
  );
}
