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
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Expense Engine</CardTitle>
        <Button onClick={() => setOpen(true)}>Add Expense</Button>
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
          <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" placeholder="Category" />
          <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" type="number" placeholder="Amount" />
          <select title="Approval status" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" defaultValue="Pending">
            <option>Pending</option>
            <option>Approved</option>
          </select>
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
