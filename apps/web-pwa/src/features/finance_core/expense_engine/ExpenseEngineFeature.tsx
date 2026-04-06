// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/apiClient";
import { validateDualApproval } from "@bdcr7/rbac-engine";
import { useToast } from "@/components/ui/toast";
import { EvidenceGate, type EvidenceGateFileReady } from "@/components/ui/EvidenceGate";

const USERS = ["Owner", "Supervisor", "Accountant", "Worker"];
const CATEGORIES = ["Materials", "Labor", "Transport", "Utility", "Misc"];
const SUBCATEGORIES: Record<string, string[]> = {
  Materials: ["Cement", "Steel", "Electrical", "Finishing", "Other"],
  Labor: ["Mason", "Welder", "Electrician", "General Labour", "Other"],
  Transport: ["Truck", "Pickup", "Courier", "Fuel", "Other"],
  Utility: ["Electricity", "Water", "Internet", "Security", "Other"],
  Misc: ["Office", "Permit", "Emergency", "Maintenance", "Other"],
};

type ExpenseStatus = "pending" | "approved";

export function ExpenseEngineFeature({ onSaved }: { onSaved?: () => void }) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const toast = useToast();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState(USERS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState(SUBCATEGORIES[CATEGORIES[0]][0]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ExpenseStatus>("pending");
  const [approverId, setApproverId] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  // Evidence enforcement state
  const [proofFileId, setProofFileId] = useState<string | null>(null);
  const [proofFileUrl, setProofFileUrl] = useState<string | null>(null);

  const canApprove = useMemo(() => {
    if (!userId || !approverId) return false;
    return validateDualApproval({ createdBy: userId, approvedBy: approverId, status: "approved" });
  }, [userId, approverId]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const rows = await apiClient<Array<{ id: string }>>("/api/finance/accounts", { method: "GET" }, token);
      if (rows?.length && rows[0]?.id) {
        setAccountId(rows[0].id);
      }
    })();
  }, [token]);

  const handleFileReady = ({ fileId, fileUrl, fileName }: EvidenceGateFileReady) => {
    setProofFileId(fileId);
    setProofFileUrl(fileUrl);
    // Try to auto-fill amount from filename hints
    const match = /(\d[\d,]*(?:\.\d{1,2})?)/.exec(fileName.replace(/[^\d.,]/g, " "));
    if (match) {
      const parsed = parseFloat(match[1].replace(/,/g, ""));
      if (parsed > 0 && !amount) setAmount(String(parsed));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !userId) return;

    // Evidence enforcement gate — block if no file
    if (!proofFileId) {
      toast.error("Proof required", "Please upload an invoice or receipt before saving.");
      return;
    }
    if (!accountId) {
      toast.error("Account required", "No fund account found. Ask your admin to create one first.");
      return;
    }

    try {
      const finalStatus: ExpenseStatus = status === "approved" && canApprove ? "approved" : "pending";
      await apiClient(
        "/api/finance/expenses/manual",
        {
          method: "POST",
          body: JSON.stringify({
            account_id: accountId,
            amount: Number(amount),
            description,
            status: finalStatus,
            category,
            subcategory,
            expense_date: date,
            paid_by: paidBy,
            receipt_url: proofFileUrl,
            proof_file_id: proofFileId,
            approved_by: finalStatus === "approved" ? approverId : null,
          }),
        },
        token,
      );

      toast.success(
        "Expense saved",
        `Status: ${finalStatus.toUpperCase()} — ${category} / ${subcategory}`,
      );
      setAmount("");
      setDescription("");
      setStatus("pending");
      setSubcategory(SUBCATEGORIES[category][0]);
      setProofFileId(null);
      setProofFileUrl(null);
      onSaved?.();
    } catch (error) {
      toast.error("Failed to save expense", (error as Error).message);
    }
  };

  return (
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45 space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Expense Tracking</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload invoice first. AI will auto-fill fields. Review and save.
        </p>
      </div>

      {/* ── STEP 1: Evidence Gate ──────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
          Step 1 — Upload Invoice / Receipt (Required)
        </p>
        <EvidenceGate
          module="finance"
          category="expense"
          subcategory="invoice"
          severity="block"
          label="Invoice or receipt required before saving expense."
          onFileReady={handleFileReady}
          onCleared={() => { setProofFileId(null); setProofFileUrl(null); }}
        />
      </div>

      {/* ── STEP 3: Manual Entry Form ─────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
          Step 3 — Review & Save
        </p>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Amount</span>
            <input
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              type="number" min="0" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount" required
            />
          </label>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Expense Date</span>
            <input
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              type="date" title="Expense date" value={date}
              onChange={(e) => setDate(e.target.value)} required
            />
          </label>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Paid By</span>
            <select
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              title="Paid by" value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              {USERS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Category</span>
            <select
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              title="Category" value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory(SUBCATEGORIES[e.target.value][0]);
              }}
            >
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Subcategory</span>
            <select
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              title="Subcategory" value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            >
              {SUBCATEGORIES[category].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Approval Status</span>
            <select
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              title="Approval status" value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted-foreground md:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Description</span>
            <textarea
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description" rows={3}
            />
          </label>
          <label className="space-y-2 text-sm text-muted-foreground md:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Approver User ID</span>
            <input
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
              value={approverId}
              onChange={(e) => setApproverId(e.target.value)}
              placeholder="Approver User ID (for Approved)"
            />
          </label>

          <button
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition md:col-span-2 ${
              proofFileId && accountId
                ? "bg-primary text-primary-foreground hover:opacity-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            type="submit"
            disabled={!token || !proofFileId || !accountId}
            title={!proofFileId ? "Upload proof file to enable save" : !accountId ? "No fund account found" : undefined}
          >
            {proofFileId && accountId ? "Save Expense" : "⬆ Upload proof file and ensure fund account exists"}
          </button>
        </form>
      </div>
    </section>
  );
}
