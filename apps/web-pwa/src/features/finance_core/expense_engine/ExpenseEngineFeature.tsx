"use client";

import { FormEvent, useMemo, useState } from "react";

import { uploadToCloudinary } from "@bdcr7/media-engine";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { validateDualApproval } from "@bdcr7/rbac-engine";

const USERS = ["Owner", "Supervisor", "Accountant", "Worker"];
const CATEGORIES = ["Materials", "Labor", "Transport", "Utility", "Misc"];

type ExpenseStatus = "pending" | "approved";

export function ExpenseEngineFeature() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState(USERS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [status, setStatus] = useState<ExpenseStatus>("pending");
  const [approverId, setApproverId] = useState("");
  const [message, setMessage] = useState("");

  const canApprove = useMemo(() => {
    if (!userId || !approverId) return false;
    return validateDualApproval({ createdBy: userId, approvedBy: approverId, status: "approved" });
  }, [userId, approverId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !userId) return;

    try {
      if (!supabase) throw new Error("Supabase is not configured");
      let receiptUrl: string | null = null;

      if (receipt) {
        receiptUrl = await uploadToCloudinary({
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
          file: receipt,
        });
      }

      const finalStatus: ExpenseStatus = status === "approved" && canApprove ? "approved" : "pending";
      const { error } = await supabase.from("expenses").insert({
        amount: Number(amount),
        description,
        status: finalStatus,
        maker_id: userId,
        category_id: null,
        metadata: {
          expense_date: date,
          paid_by: paidBy,
          category,
          receipt_url: receiptUrl,
          approval_status: finalStatus,
          approved_by: finalStatus === "approved" ? approverId : null,
        },
      });
      if (error) throw error;
      setMessage(`Expense saved with status: ${finalStatus.toUpperCase()}`);
      setAmount("");
      setDescription("");
      setReceipt(null);
      setStatus("pending");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h3>Expense Tracking</h3>
      <form onSubmit={onSubmit} className="formGrid">
        <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (Number)" required />
        <input type="date" title="Expense date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <select title="Paid by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          {USERS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select title="Expense category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} />
        <input type="file" title="Receipt upload" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />

        <select title="Approval status" value={status} onChange={(e) => setStatus(e.target.value as ExpenseStatus)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
        <input value={approverId} onChange={(e) => setApproverId(e.target.value)} placeholder="Approver User ID (for Approved)" />

        <button type="submit" disabled={!token}>Save Expense</button>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
