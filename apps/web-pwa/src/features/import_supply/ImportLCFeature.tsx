"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type LCStatus = "open" | "processing" | "shipped" | "cleared" | "closed";

interface LCRecord {
  id: string;
  supplier_name: string;
  lc_number: string;
  currency: string;
  amount: number;
  expected_arrival: string;
  status: LCStatus;
  created_at: string;
}

const STATUS_LABELS: Record<LCStatus, string> = {
  open: "Open",
  processing: "Processing",
  shipped: "Shipped",
  cleared: "Cleared",
  closed: "Closed",
};

const STATUS_COLORS: Record<LCStatus, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  shipped: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  cleared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "BDT", "SGD"];

const EMPTY_FORM = {
  supplier_name: "",
  lc_number: "",
  currency: "USD",
  amount: "",
  expected_arrival: "",
  status: "open" as LCStatus,
};

export function ImportLCFeature() {
  const supabase = useMemo(() => createClient(), []);
  const [records, setRecords] = useState<LCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lc_records")
      .select("id,supplier_name,lc_number,currency,amount,expected_arrival,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRecords((data || []) as LCRecord[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.supplier_name.trim() || !form.lc_number.trim() || !form.amount || !form.expected_arrival) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    const { error: dbErr } = await supabase.from("lc_records").insert({
      supplier_name: form.supplier_name.trim(),
      lc_number: form.lc_number.trim(),
      currency: form.currency,
      amount: parseFloat(form.amount),
      expected_arrival: form.expected_arrival,
      status: form.status,
      created_by: null,
    });
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchRecords();
  };

  const deleteRecord = async (id: string) => {
    await supabase.from("lc_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const totalValue = records.reduce((s, r) => s + r.amount, 0);
  const openCount = records.filter((r) => r.status === "open" || r.status === "processing").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Import & L/C Tracker</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Letter of Credit records — {records.length} total • {openCount} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={fetchRecords} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          <Button className="h-8 px-3 text-xs" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            {showForm ? "Cancel" : "New L/C"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total L/Cs", value: String(records.length) },
          { label: "Active / Processing", value: String(openCount) },
          { label: "Cleared / Closed", value: String(records.filter((r) => r.status === "cleared" || r.status === "closed").length) },
          { label: "Total Value", value: `$${totalValue.toLocaleString("en-US")}` },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1.5 text-xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <CardTitle>নতুন L/C এন্ট্রি — New L/C Entry</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Supplier Name *</label>
                    <input
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.supplier_name} onChange={set("supplier_name")}
                      placeholder="e.g. China Steel Co."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">L/C Number *</label>
                    <input
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.lc_number} onChange={set("lc_number")}
                      placeholder="e.g. LC-2025-001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Currency *</label>
                    <select
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.currency} onChange={set("currency")}
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Amount *</label>
                    <input
                      type="number" min="0" step="0.01"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.amount} onChange={set("amount")}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Expected Arrival *</label>
                    <input
                      type="date"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.expected_arrival} onChange={set("expected_arrival")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.status} onChange={set("status")}
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {error ? <p className="sm:col-span-2 lg:col-span-3 text-sm text-rose-600">{error}</p> : null}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={saving} className="h-9 px-5">
                      {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                      {saving ? "Saving..." : "Save L/C Record"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>L/C Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              কোনো L/C রেকর্ড নেই — No L/C records yet. Add your first one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="py-2 pr-4">L/C Number</th>
                    <th className="py-2 pr-4">Supplier</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Arrival</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 pr-4 font-mono text-xs text-foreground">{r.lc_number}</td>
                      <td className="py-2.5 pr-4 font-medium text-foreground">{r.supplier_name}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {r.currency} {Number(r.amount).toLocaleString("en-US")}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{r.expected_arrival?.slice(0, 10)}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[r.status as LCStatus] || STATUS_COLORS.open}`}>
                          {STATUS_LABELS[r.status as LCStatus] || r.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                          onClick={() => deleteRecord(r.id)}
                          aria-label={`Delete L/C ${r.lc_number}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
