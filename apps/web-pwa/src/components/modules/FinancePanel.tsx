"use client";

import { FormEvent, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function FinancePanel() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const [accountId, setAccountId] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const submitTransfer = async () => {
    if (!token || !userId || !accountId || !targetAccountId || !amount) {
      setMessage("All fields required for transfer");
      return;
    }
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }
      const transferAmount = Number(amount);
      const { data: accounts, error: accountsErr } = await supabase
        .from("fund_accounts")
        .select("id,balance")
        .in("id", [accountId, targetAccountId]);
      if (accountsErr) {
        throw new Error(accountsErr.message);
      }
      const from = (accounts || []).find((a: { id: string }) => a.id === accountId) as { id: string; balance: number | string } | undefined;
      const to = (accounts || []).find((a: { id: string }) => a.id === targetAccountId) as { id: string; balance: number | string } | undefined;
      if (!from || !to) {
        throw new Error("Account not found");
      }
      const fromBalance = Number(from.balance || 0);
      const toBalance = Number(to.balance || 0);
      if (fromBalance < transferAmount) {
        throw new Error("Insufficient funds");
      }

      const nextFrom = fromBalance - transferAmount;
      const nextTo = toBalance + transferAmount;
      const { error: fromErr } = await supabase.from("fund_accounts").update({ balance: nextFrom }).eq("id", accountId);
      if (fromErr) {
        throw new Error(fromErr.message);
      }
      const { error: toErr } = await supabase.from("fund_accounts").update({ balance: nextTo }).eq("id", targetAccountId);
      if (toErr) {
        throw new Error(toErr.message);
      }

      const { error: txErr } = await supabase.from("fund_transactions").insert({
        from_account_id: accountId,
        to_account_id: targetAccountId,
        amount: transferAmount,
        reference: description || "Transfer",
        created_by: userId,
      });
      if (txErr) {
        throw new Error(txErr.message);
      }

      setMessage(`Transfer completed | from ${nextFrom.toFixed(2)} -> to ${nextTo.toFixed(2)}`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const submitExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !userId) return;
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }
      const payload = {
        account_id: accountId,
        category_id: categoryId || null,
        amount: Number(amount),
        description,
        status: "pending",
        maker_id: userId,
      };
      const { data, error } = await supabase.from("expenses").insert(payload).select("id,status").single();
      if (error) {
        throw new Error(error.message);
      }
      setMessage(`Expense created: ${data.id} (${data.status})`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h2>Finance Core</h2>
      <form onSubmit={submitExpense} className="formGrid">
        <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="Account ID" />
        <input value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)} placeholder="Target Account ID (for transfer)" />
        <input value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Category ID" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (decimal)" type="number" step="0.01" min="0" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description/Ref" maxLength={100} />
        <div className="actions">
          <button type="submit" disabled={!token}>Create Expense</button>
          <button type="button" onClick={submitTransfer} disabled={!token || !targetAccountId}>Transfer Funds</button>
        </div>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
