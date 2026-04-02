"use client";

import { FormEvent, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

const SOURCE_OPTIONS = ["Client", "Owner", "Bank", "Investor", "Other"];
const METHOD_OPTIONS = ["Cash", "Bank", "bKash"];

export function FundManagerFeature() {
  const userId = useAuthStore((s) => s.userId);
  const token = useAuthStore((s) => s.token);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceSender, setSourceSender] = useState(SOURCE_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState(METHOD_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !userId) return;
    if (!amount || Number(amount) <= 0) {
      setMessage("Amount must be greater than zero");
      return;
    }

    try {
      if (!supabase) throw new Error("Supabase is not configured");
      const payload = {
        amount: Number(amount),
        reference: `${sourceSender}-${paymentMethod}`,
        metadata: {
          date,
          source_sender: sourceSender,
          payment_method: paymentMethod,
          description,
          created_by: userId,
        },
      };
      const { error } = await supabase.from("fund_transactions").insert(payload);
      if (error) throw error;
      setMessage("Fund entry created successfully");
      setAmount("");
      setDescription("");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h3>Fund Management</h3>
      <form onSubmit={onSubmit} className="formGrid">
        <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (Number)" required />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <select value={sourceSender} onChange={(e) => setSourceSender(e.target.value)}>
          {SOURCE_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {METHOD_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (Textarea)" rows={3} />
        <button type="submit" disabled={!token}>Save Fund Entry</button>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
