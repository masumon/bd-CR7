"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Landmark, Link2, WalletCards } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

const SOURCE_OPTIONS = ["Client", "Owner", "Bank", "Investor", "Other"];
const METHOD_OPTIONS = [
  "bKash",
  "Nagad",
  "Bank Transfer",
  "Western Union",
  "MoneyGram",
  "Wise",
  "Cash",
  "Other",
];

export function FundManagerFeature({ onSaved }: { onSaved?: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const userId = useAuthStore((s) => s.userId);
  const token  = useAuthStore((s) => s.token);

  const [amount, setAmount]               = useState("");
  const [date, setDate]                   = useState(new Date().toISOString().slice(0, 10));
  const [sourceSender, setSourceSender]   = useState(SOURCE_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState(METHOD_OPTIONS[0]);
  const [description, setDescription]     = useState("");
  const [receiptUrl, setReceiptUrl]       = useState("");
  const [message, setMessage]             = useState("");
  const [accountId, setAccountId]         = useState<string | null>(null);
  const [noAccount, setNoAccount]         = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("fund_accounts").select("id").limit(1).maybeSingle();
      if (data?.id) setAccountId(data.id);
      else setNoAccount(true);
    })();
  }, [supabase]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !userId) return;
    if (!amount || Number(amount) <= 0) { setMessage("Amount must be greater than zero"); return; }
    if (!accountId) { setMessage("No fund account found. Ask your admin to create one first."); return; }

    try {
      const payload = {
        from_account_id: accountId,
        to_account_id:   accountId,
        amount:    Number(amount),
        reference: `${sourceSender}-${paymentMethod}-${date}`,
        created_by: userId,
      };
      const { error } = await supabase.from("fund_transactions").insert(payload);
      if (error) throw error;
      setMessage("Fund entry created successfully.");
      setAmount("");
      setDescription("");
      setReceiptUrl("");
      onSaved?.();
    } catch (err) {
      setMessage((err as Error).message);
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
          {noAccount && (
            <div className="md:col-span-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              No fund account configured. Ask admin to create one before saving fund entries.
            </div>
          )}
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
          <label className="space-y-2 text-sm text-muted-foreground md:col-span-2">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]"><Link2 className="h-3.5 w-3.5" /> Receipt URL (optional)</span>
            <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="url" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." />
          </label>
          <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:pointer-events-none disabled:opacity-60 md:col-span-2" type="submit" disabled={!token || noAccount}>Save Fund Entry</button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
