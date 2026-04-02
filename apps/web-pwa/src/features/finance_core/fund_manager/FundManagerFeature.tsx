"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, Landmark, WalletCards } from "lucide-react";

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
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Fund Management</h3>
          <p className="mt-1 text-sm text-muted-foreground">Capture source, sender, and payment method in a cleaner intake flow.</p>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <WalletCards className="h-5 w-5" />
        </div>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm text-muted-foreground md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em]">Amount</span>
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" required />
        </label>
        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]"><CalendarDays className="h-3.5 w-3.5" /> Transaction Date</span>
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="date" title="Transaction date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]"><Landmark className="h-3.5 w-3.5" /> Source / Sender</span>
          <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Source or sender" value={sourceSender} onChange={(e) => setSourceSender(e.target.value)}>
            {SOURCE_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-[0.14em]">Payment Method</span>
          <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {METHOD_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted-foreground md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em]">Description</span>
          <textarea className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} />
        </label>
        <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:pointer-events-none disabled:opacity-60 md:col-span-2" type="submit" disabled={!token}>Save Fund Entry</button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
