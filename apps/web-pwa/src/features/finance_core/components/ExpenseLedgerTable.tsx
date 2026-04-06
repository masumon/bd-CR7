// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Table, Td, Th } from "@/components/ui/table";
import type { ExpenseRow } from "@/features/finance_core/types";

export function ExpenseLedgerTable({
  loading,
  rows,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  rows: ExpenseRow[];
  onEdit: (row: ExpenseRow) => void;
  onDelete: (id: string) => void;
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
                    <button onClick={() => onEdit(row)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(row.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition" title="Delete">
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
  );
}
