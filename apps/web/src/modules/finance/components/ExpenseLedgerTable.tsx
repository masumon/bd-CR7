// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BadgeDollarSign, CheckCircle2, Pencil, Trash2, XCircle } from "lucide-react";

import { DynamicTable } from "@/modules/_shared";
import type { ExpenseRow } from "@/modules/finance/types";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  rejected: "bg-rose-500/15 text-rose-400 border border-rose-500/25",
  pending:  "bg-amber-500/15 text-amber-400 border border-amber-500/25",
};

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
  const columns = useMemo<Array<ColumnDef<ExpenseRow, unknown>>>(
    () => [
      {
        header: "Expense ID",
        accessorKey: "id",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.id.slice(0, 8).toUpperCase()}</span>,
      },
      {
        header: "Category",
        id: "category",
        cell: ({ row }) => {
          const metaCategory = typeof row.original.metadata?.category === "string" ? row.original.metadata.category : "";
          return metaCategory || row.original.description?.split(" ")[0] || "General";
        },
      },
      {
        header: "Subcategory",
        id: "subcategory",
        cell: ({ row }) => {
          const metaSubcategory = typeof row.original.metadata?.subcategory === "string" ? row.original.metadata.subcategory : "General";
          return <span className="text-muted-foreground">{metaSubcategory}</span>;
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => <span className="font-medium">৳{Number(row.original.amount || 0).toLocaleString("en-BD")}</span>,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
          const statusKey = String(row.original.status).toLowerCase();
          const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
          const statusCls = STATUS_STYLES[statusKey] ?? STATUS_STYLES.pending;
          return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls}`}>{statusLabel}</span>;
        },
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => {
          const statusKey = String(row.original.status).toLowerCase();
          return (
            <div className="flex items-center justify-end gap-1">
              {canApprove && statusKey === "pending" && onApprove ? (
                <>
                  <button
                    onClick={() => onApprove(row.original.id, "approved")}
                    className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/15 hover:text-emerald-300"
                    title="Approve"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onApprove(row.original.id, "rejected")}
                    className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-500/15 hover:text-rose-300"
                    title="Reject"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              ) : null}
              <button onClick={() => onEdit(row.original)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(row.original.id)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [canApprove, onApprove, onDelete, onEdit]
  );

  return (
    <div className="space-y-3">
      {!loading && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BadgeDollarSign className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No expense records yet</p>
          <p className="text-xs text-muted-foreground/70">Add your first expense using the button above.</p>
        </div>
      ) : null}

      {/* Mobile card layout — shown on xs/sm screens only */}
      {!loading && rows.length > 0 ? (
        <div className="block sm:hidden space-y-2">
          {rows.map((row) => {
            const statusKey = String(row.status).toLowerCase();
            const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
            const statusCls = STATUS_STYLES[statusKey] ?? STATUS_STYLES.pending;
            const metaCategory = typeof row.metadata?.category === "string" ? row.metadata.category : "";
            const category = metaCategory || row.description?.split(" ")[0] || "General";
            return (
              <div key={row.id} className="rounded-xl border border-border/60 bg-card p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{category}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls}`}>{statusLabel}</span>
                </div>
                <p className="mt-1.5 font-medium text-foreground">৳{Number(row.amount || 0).toLocaleString("en-BD")}</p>
                <div className="mt-2 flex items-center gap-1">
                  {canApprove && statusKey === "pending" && onApprove ? (
                    <>
                      <button onClick={() => onApprove(row.id, "approved")} className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/15" title="Approve"><CheckCircle2 className="h-4 w-4" /></button>
                      <button onClick={() => onApprove(row.id, "rejected")} className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-500/15" title="Reject"><XCircle className="h-4 w-4" /></button>
                    </>
                  ) : null}
                  <button onClick={() => onEdit(row)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(row.id)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Desktop table — hidden on xs/sm */}
      <div className="hidden sm:block">
        <DynamicTable data={rows} columns={columns} loading={loading} emptyLabel="No expense records yet" />
      </div>

      {/* Loading skeleton on mobile */}
      {loading ? (
        <div className="block sm:hidden space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-3 animate-pulse">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
