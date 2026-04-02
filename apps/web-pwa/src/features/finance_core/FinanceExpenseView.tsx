"use client";

import { useState } from "react";
import { ArrowDownUp, BadgeDollarSign, ClipboardCheck, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, Td, Th } from "@/components/ui/table";
import { FundManagerFeature } from "./fund_manager/FundManagerFeature";
import { ExpenseEngineFeature } from "./expense_engine/ExpenseEngineFeature";

const rows = [
  { id: "EXP-1001", category: "Materials", amount: 5600, status: "Pending" },
  { id: "EXP-1002", category: "Labor", amount: 2300, status: "Approved" },
  { id: "EXP-1003", category: "Transport", amount: 1290, status: "Pending" },
  { id: "EXP-1004", category: "Utility", amount: 710, status: "Approved" },
];

export function FinanceExpenseView() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white/85 via-white/80 to-primary/5 dark:from-slate-950/70 dark:via-slate-950/60 dark:to-primary/10">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Finance Workspace
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Expense control with clear categories, subcategories, and approval context.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                This screen now separates intake, approval, and ledger visibility so accounting actions do not feel like one flat table.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "Fund Intake", desc: "Client receipt, owner transfer, bank trace", icon: ArrowDownUp },
                { title: "Expense Engine", desc: "Materials, labor, transport, utility", icon: ReceiptText },
                { title: "Approval Desk", desc: "Checker validation and payout clearance", icon: ClipboardCheck },
              ].map(({ title, desc, icon: Icon }) => (
                <div key={title} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Finance Snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              {[
                { label: "Pending approvals", value: "02", tone: "amber" },
                { label: "Approved today", value: "$3,010", tone: "emerald" },
                { label: "Receipts missing", value: "01", tone: "rose" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Expense Ledger</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Detailed category-level records with quick status scanning.</p>
            </div>
            <Button onClick={() => setOpen(!open)} className="w-full sm:w-auto">
              {open ? "Close Forms" : "Add Fund / Expense"}
            </Button>
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
                      <Td className="font-medium text-foreground">{row.id}</Td>
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Materials", value: "$5,600", width: "w-[82%]" },
              { label: "Labor", value: "$2,300", width: "w-[61%]" },
              { label: "Transport", value: "$1,290", width: "w-[43%]" },
              { label: "Utility", value: "$710", width: "w-[26%]" },
            ].map((item) => (
              <div key={item.label} className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className={`h-2 rounded-full bg-primary ${item.width}`} />
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              Use the expense form to keep category and receipt data complete before the checker review stage.
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Finance Actions">
        <div className="space-y-4">
          <FundManagerFeature />
          <ExpenseEngineFeature />
        </div>
      </Dialog>
    </div>
  );
}
