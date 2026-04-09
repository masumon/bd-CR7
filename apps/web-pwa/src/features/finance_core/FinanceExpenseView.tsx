// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { ArrowDownUp, BadgeDollarSign, CheckCircle2, MoreHorizontal, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { exportCSV } from "@/lib/exportCSV";
import { exportHTML } from "@/lib/exportHTML";
import { FundManagerFeature } from "./fund_manager/FundManagerFeature";
import { ExpenseEngineFeature } from "./expense_engine/ExpenseEngineFeature";
import { ProjectFilesPanel } from "@/components/ui/ProjectFilesPanel";
import { ExpenseBreakdownCard } from "@/features/finance_core/components/ExpenseBreakdownCard";
import { ExpenseDialogs } from "@/features/finance_core/components/ExpenseDialogs";
import { ExpenseLedgerTable } from "@/features/finance_core/components/ExpenseLedgerTable";
import { useFinanceExpenses } from "@/features/finance_core/hooks/useFinanceExpenses";

export function FinanceExpenseView() {
  const finance = useFinanceExpenses();

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Finance Workspace / তহবিল ও খরচ"
        stats={[
          { label: "Pending Approvals", value: String(finance.pendingApprovals) },
          { label: "Approved Today", value: `৳${finance.approvedToday.toLocaleString("en-BD")}` },
          { label: "Receipts Missing", value: String(finance.receiptsMissing) },
        ]}
      />

      <SectionHeader
        eyebrow="Ledger / লেজার"
        title="Finance records with category and subcategory"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => finance.setOpen(!finance.open)} className="w-full sm:w-auto">{finance.open ? "Close Forms" : "Add Fund / Expense"}</Button>
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
                      { label: "Pending Approvals", labelBn: "অনুমোদন বাকি", value: String(finance.pendingApprovals) },
                      { label: "Approved Today", labelBn: "আজ অনুমোদিত", value: `৳${finance.approvedToday.toLocaleString("en-BD")}` },
                      { label: "Receipts Missing", labelBn: "রসিদ নেই", value: String(finance.receiptsMissing) },
                      { label: "Total Records", labelBn: "মোট রেকর্ড", value: String(finance.rows.length) },
                    ],
                  },
                  {
                    title: "Category Breakdown",
                    titleBn: "ক্যাটাগরি বিশ্লেষণ",
                    rows: finance.categoryBreakdown.map((c) => ({
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
                    tableRows: finance.rows.slice(0, 20).map((row) => {
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
                const rows = finance.buildExportRows();
                exportCSV("finance-expenses.csv", rows);
              }}
            >
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const rows = finance.buildExportRows();
                exportHTML({ title: "Finance Expenses", titleBn: "ব্যয় লেজার", rows });
              }}
            >
              HTML
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader>
            <CardTitle>Expense Ledger</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Detailed finance entries with category, subcategory, and approval status.</p>
          </CardHeader>
          <CardContent>
            <ExpenseLedgerTable
              loading={finance.loading}
              rows={finance.rows}
              onEdit={finance.openEdit}
              onDelete={finance.setDeleteTarget}
              canApprove={finance.canApprove}
              onApprove={(id, decision) => finance.setApprovalTarget({ id, decision })}
            />
          </CardContent>
        </Card>

        <ExpenseBreakdownCard loading={finance.loading} categoryBreakdown={finance.categoryBreakdown} subcategoryBreakdown={finance.subcategoryBreakdown} />
      </div>

      <Dialog open={finance.open} onClose={() => finance.setOpen(false)} title="Finance Actions">
        <div className="space-y-4">
          <FundManagerFeature onSaved={finance.loadExpenses} />
          <ExpenseEngineFeature onSaved={finance.loadExpenses} />
        </div>
      </Dialog>

      <ProjectFilesPanel
        module="finance"
        category="invoice"
        label="Invoice Proofs & Finance Documents"
      />

      <ExpenseDialogs
        editTarget={finance.editTarget}
        setEditTarget={finance.setEditTarget}
        editForm={finance.editForm}
        setEditForm={finance.setEditForm}
        saving={finance.saving}
        mutationError={finance.mutationError}
        onSave={finance.submitEdit}
        deleteTarget={finance.deleteTarget}
        setDeleteTarget={finance.setDeleteTarget}
        onDelete={finance.confirmDelete}
      />

      {/* ── Approval Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!finance.approvalTarget}
        onClose={() => { finance.setApprovalTarget(null); finance.setApprovalNote(""); finance.setApprovalError(""); }}
        title={finance.approvalTarget?.decision === "approved" ? "Approve Expense" : "Reject Expense"}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
            {finance.approvalTarget?.decision === "approved" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
            )}
            <p className="text-sm text-muted-foreground">
              {finance.approvalTarget?.decision === "approved"
                ? "Confirm approval of this expense. An audit record will be created."
                : "Confirm rejection of this expense. A note is required for the audit trail."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Note <span className="text-rose-400">*</span> (min 2 chars)
            </label>
            <textarea
              rows={3}
              value={finance.approvalNote}
              onChange={(e) => finance.setApprovalNote(e.target.value)}
              placeholder={finance.approvalTarget?.decision === "approved" ? "e.g. Verified receipts and amounts" : "e.g. Missing receipt, please resubmit"}
              className="w-full resize-none rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {finance.approvalError && (
            <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{finance.approvalError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { finance.setApprovalTarget(null); finance.setApprovalNote(""); finance.setApprovalError(""); }}>
              Cancel
            </Button>
            <Button
              className={finance.approvalTarget?.decision === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}
              disabled={finance.approving}
              onClick={() => void finance.submitApproval()}
            >
              {finance.approving ? "Saving…" : finance.approvalTarget?.decision === "approved" ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
