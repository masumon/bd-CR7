"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, Td, Th } from "@/components/ui/table";

const rows = [
  { id: "EXP-1001", category: "Materials", amount: 5600, status: "Pending" },
  { id: "EXP-1002", category: "Labor", amount: 2300, status: "Approved" },
  { id: "EXP-1003", category: "Transport", amount: 1290, status: "Pending" },
  { id: "EXP-1004", category: "Utility", amount: 710, status: "Approved" },
];

export function FinanceExpenseView() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Expense Engine</CardTitle>
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">Add Expense</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Expense ID</Th>
                <Th>Category</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>{row.id}</Td>
                  <Td>{row.category}</Td>
                  <Td>${row.amount.toLocaleString()}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-1 text-xs ${row.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {row.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add Expense">
        <form className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="expenseCategory" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Category</label>
            <input id="expenseCategory" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" placeholder="Category" />
          </div>
          <div className="space-y-2">
            <label htmlFor="expenseAmount" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Amount</label>
            <input id="expenseAmount" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" type="number" placeholder="Amount" />
          </div>
          <div className="space-y-2">
            <label htmlFor="expenseStatus" className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Approval Status</label>
            <select id="expenseStatus" title="Approval status" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" defaultValue="Pending">
            <option>Pending</option>
            <option>Approved</option>
            </select>
          </div>
          <label className="block rounded-xl border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            Cloudinary Receipt Upload
            <input className="hidden" type="file" />
          </label>
          <Button className="w-full">Save Expense</Button>
        </form>
      </Dialog>
    </Card>
  );
}
