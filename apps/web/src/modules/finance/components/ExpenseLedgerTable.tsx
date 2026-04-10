// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { BadgeDollarSign, CheckCircle2, Pencil, Trash2, XCircle } from "lucide-react";

import { Table, Td, Th } from "@/components/ui/table";
import type { ExpenseRow } from "@/modules/finance/types";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  rejected: "bg-rose-500/15 text-rose-400 border border-rose-500/25",
  pending:  "bg-amber-500/15 text-amber-400 border border-amber-500/25",
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[80, 64, 72, 56, 52, 40].map((w, i) => (
        <Td key={i}>
          <span className="inline-block h-3 rounded-md bg-muted" style={{ width: w }} />
        </Td>
      ))}
    </tr>
  );
}

export function ExpenseLedgerTable({
  loading,
  rows,
  onEdit,
  onDelete,
  canApprove = false,
  onApprove,
}: {
  loading: boolean;
  rows: ExpenseRow[];
  onEdit: (row: ExpenseRow) => void;
  onDelete: (id: string) => void;
  canApprove?: boolean;
  onApprove?: (id: string, decision: "approved" | "rejected") => void;
}) {
  return (
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
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : rows.map((row) => {
                const metaCategory = typeof row.metadata?.category === "string" ? row.metadata.category : "";
                const metaSubcategory = typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "General";
                const category = metaCategory || row.description?.split(" ")[0] || "General";
                const statusKey = String(row.status).toLowerCase();
                const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                const statusCls = STATUS_STYLES[statusKey] ?? STATUS_STYLES.pending;
                return (
                  <tr key={row.id} className="transition-colors hover:bg-muted/30">
                    <Td className="font-medium text-foreground">{row.id.slice(0, 8).toUpperCase()}</Td>
                    <Td>{category}</Td>
                    <Td className="text-muted-foreground">{metaSubcategory}</Td>
                    <Td className="font-medium">৳{Number(row.amount || 0).toLocaleString("en-BD")}</Td>
                    <Td>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Approve / Reject — visible only to admin/checker on pending rows */}
                        {canApprove && statusKey === "pending" && onApprove && (
                          <>
                            <button
                              onClick={() => onApprove(row.id, "approved")}
                              className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/15 hover:text-emerald-300"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onApprove(row.id, "rejected")}
                              className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-500/15 hover:text-rose-300"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => onEdit(row)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(row.id)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
          {!loading && rows.length === 0 && (
            <tr>
              <Td colSpan={6}>
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <BadgeDollarSign className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No expense records yet</p>
                  <p className="text-xs text-muted-foreground/70">Add your first expense using the button above.</p>
                </div>
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
