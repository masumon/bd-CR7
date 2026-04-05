"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, BadgeDollarSign, MoreHorizontal, Pencil, Trash2 } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, Td, Th } from "@/components/ui/table";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { exportCSV } from "@/lib/exportCSV";
import { exportHTML } from "@/lib/exportHTML";
import { createClient } from "@/lib/supabase/client";
import { FundManagerFeature } from "./fund_manager/FundManagerFeature";
import { ExpenseEngineFeature } from "./expense_engine/ExpenseEngineFeature";
import { ProjectFilesPanel } from "@/components/ui/ProjectFilesPanel";

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
  const [editTarget, setEditTarget] = useState<ExpenseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [editForm, setEditForm] = useState({ amount: 0, status: "pending", description: "", category: "", subcategory: "" });

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

  const buildExportRows = useCallback(() => {
    return rows.map((row) => {
      const category = typeof row.metadata?.category === "string"
        ? row.metadata.category
        : row.description?.split(" ")[0] || "General";
      const subcategory = typeof row.metadata?.subcategory === "string"
        ? row.metadata.subcategory
        : "General";

      return {
        id: row.id,
        category,
        subcategory,
        amount: Number(row.amount || 0),
        status: String(row.status),
        createdAt: row.created_at || "",
      };
    });
  }, [rows]);

  const handleEditOpen = (row: ExpenseRow) => {
    setEditForm({
      amount: Number(row.amount),
      status: String(row.status),
      description: row.description ?? "",
      category: typeof row.metadata?.category === "string" ? row.metadata.category : "",
      subcategory: typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "",
    });
    setEditTarget(row);
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setMutationError("");
    const { error } = await supabase.from("expenses").update({
      amount: editForm.amount,
      status: editForm.status,
      description: editForm.description,
      metadata: { category: editForm.category, subcategory: editForm.subcategory },
    }).eq("id", editTarget.id);
    setSaving(false);
    if (error) { setMutationError(error.message); return; }
    setEditTarget(null);
    await loadExpenses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setMutationError("");
    const { error } = await supabase.from("expenses").delete().eq("id", deleteTarget);
    if (error) { setMutationError(error.message); return; }
    setDeleteTarget(null);
    await loadExpenses();
  };

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Finance Workspace / তহবিল ও খরচ"
        stats={[
          { label: "Pending Approvals", value: String(pendingApprovals) },
          { label: "Approved Today", value: `৳${approvedToday.toLocaleString("en-BD")}` },
          { label: "Receipts Missing", value: String(receiptsMissing) },
        ]}
      />

      <SectionHeader
        eyebrow="Ledger / লেজার"
        title="Finance records with category and subcategory"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setOpen(!open)} className="w-full sm:w-auto">{open ? "Close Forms" : "Add Fund / Expense"}</Button>
            <ExportPDFButton
              onBuildOptions={() => ({                moduleName: "Finance",
                moduleNameBn: "অর্থায়ন ও ব্যয়",
                description: "Finance ledger showing expense records, categories, and approval status.",
                descriptionBn: "অর্থায়ন লেজার — ব্যয়ের রেকর্ড, ক্যাটাগরি এবং অনুমোদনের অবস্থা।",
                sections: [
                  {
                    title: "Finance Overview",
                    titleBn: "আর্থিক সংক্ষিপ্ত বিবরণ",
                    rows: [
                      { label: "Pending Approvals", labelBn: "অনুমোদন বাকি", value: String(pendingApprovals) },
                      { label: "Approved Today", labelBn: "আজ অনুমোদিত", value: `৳${approvedToday.toLocaleString("en-BD")}` },
                      { label: "Receipts Missing", labelBn: "রসিদ নেই", value: String(receiptsMissing) },
                      { label: "Total Records", labelBn: "মোট রেকর্ড", value: String(rows.length) },
                    ],
                  },
                  {
                    title: "Category Breakdown",
                    titleBn: "ক্যাটাগরি বিশ্লেষণ",
                    rows: categoryBreakdown.map((c) => ({
                      label: c.label,
                      labelBn: c.label,
                      value: `৳${c.value.toLocaleString("en-BD")}`,
                    })),
                  },
                  {
                    title: "Expense Ledger",
                    titleBn: "ব্যয় লেজার",
                    rows: [],
                    tableHeaders: ["ID", "Category", "Subcategory", "Amount", "Status"],
                    tableHeadersBn: ["আইডি", "ক্যাটাগরি", "উপ-ক্যাটাগরি", "পরিমাণ", "স্ট্যাটাস"],
                    tableRows: rows.slice(0, 20).map((row) => {
                      const metaCategory = typeof row.metadata?.category === "string" ? row.metadata.category : "";
                      const metaSubcategory = typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "General";
                      const category = metaCategory || row.description?.split(" ")[0] || "General";
                      const approved = String(row.status).toLowerCase() === "approved";
                      return [
                        row.id.slice(0, 8).toUpperCase(),
                        category,
                        metaSubcategory,
                        `৳${Number(row.amount || 0).toLocaleString("en-BD")}`,
                        approved ? "✓ Approved" : "⏳ Pending",
                      ];
                    }),
                  },
                ],
              })}
            />
            <Button
              variant="outline"
              onClick={() => {
                const rows = buildExportRows();
                exportCSV("finance-expenses.csv", rows);
              }}
            >
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const rows = buildExportRows();
                exportHTML({ title: "Finance Expenses", titleBn: "ব্যয় লেজার", rows });
              }}
            >
              HTML
            </Button>
          </div>
        }
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditOpen(row)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(row.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

      <ProjectFilesPanel
        module="finance"
        category="invoice"
        label="Invoice Proofs & Finance Documents"
      />

      {editTarget && (
        <Dialog open title="Edit Expense" onClose={() => setEditTarget(null)}>
          <div className="space-y-3">
            <div>
              <label htmlFor="expense-edit-amount" className="mb-1 block text-xs text-muted-foreground">Amount</label>
              <input
                id="expense-edit-amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label htmlFor="expense-edit-status" className="mb-1 block text-xs text-muted-foreground">Status</label>
              <select
                id="expense-edit-status"
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div>
              <label htmlFor="expense-edit-description" className="mb-1 block text-xs text-muted-foreground">Description</label>
              <input
                id="expense-edit-description"
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label htmlFor="expense-edit-category" className="mb-1 block text-xs text-muted-foreground">Category</label>
              <input
                id="expense-edit-category"
                type="text"
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label htmlFor="expense-edit-subcategory" className="mb-1 block text-xs text-muted-foreground">Subcategory</label>
              <input
                id="expense-edit-subcategory"
                type="text"
                value={editForm.subcategory}
                onChange={(e) => setEditForm((f) => ({ ...f, subcategory: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition"
              />
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
          <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this expense? This action cannot be undone.</p>
          {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
          <div className="flex gap-2">
            <Button onClick={handleDelete}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
