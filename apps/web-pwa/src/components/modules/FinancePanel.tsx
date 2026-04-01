"use client";

import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function FinancePanel() {
  const token = useAuthStore((s) => s.token);
  const [accountId, setAccountId] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const submitTransfer = async () => {
    if (!token) return;
    try {
      const response = await apiRequest<{ message: string; transaction_id: string; from_balance: number | string; to_balance: number | string }>(
        "/finance/transfer",
        {
          method: "POST",
          body: JSON.stringify({
            from_account_id: accountId,
            to_account_id: targetAccountId,
            amount: Number(amount),
            reference: description || "Transfer",
          }),
        },
        token
      );
      setMessage(
        `${response.message}: ${response.transaction_id} | from ${Number(response.from_balance)} -> to ${Number(response.to_balance)}`
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const submitExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      const response = await apiRequest<{ id: string; status: string }>(
        "/finance/expenses",
        {
          method: "POST",
          body: JSON.stringify({
            account_id: accountId,
            category_id: categoryId,
            amount: Number(amount),
            description,
          }),
        },
        token
      );
      setMessage(`Expense created: ${response.id} (${response.status})`);
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
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <div className="actions">
          <button type="submit" disabled={!token}>Create Expense</button>
          <button type="button" onClick={submitTransfer} disabled={!token || !targetAccountId}>Transfer Funds</button>
        </div>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
