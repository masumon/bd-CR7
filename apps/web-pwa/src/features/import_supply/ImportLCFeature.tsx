// MODULE LOCKED: FULL API MODE (NO SUPABASE WRITE)
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
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

const SUPPLY_TAXONOMY = {
  "Raw Materials": ["Cement", "Steel", "Aggregate", "Electrical", "Other"],
  Equipment: ["Machinery", "Generator", "Safety Gear", "Tools", "Other"],
  Finishing: ["Tiles", "Paint", "Glass", "Interior", "Other"],
  Logistics: ["Sea Freight", "Air Freight", "Customs", "Port Handling", "Other"],
} as const;

type SupplyCategory = keyof typeof SUPPLY_TAXONOMY;

const EMPTY_FORM = {
  supplier_name: "",
  lc_number: "",
  currency: "USD",
  amount: "",
  expected_arrival: "",
  status: "open" as LCStatus,
  category: "Raw Materials" as SupplyCategory,
  subcategory: "Cement",
};

export function ImportLCFeature() {
  const supabase = useMemo(() => createClient(), []);
  const [records, setRecords] = useState<LCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [tagsByLc, setTagsByLc] = useState<Record<string, { category: SupplyCategory; subcategory: string }>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bdcr7-import-tags");
      if (!raw) return;
      setTagsByLc(JSON.parse(raw) as Record<string, { category: SupplyCategory; subcategory: string }>);
    } catch {
      setTagsByLc({});
    }
  }, []);

  const saveTags = useCallback((next: Record<string, { category: SupplyCategory; subcategory: string }>) => {
    setTagsByLc(next);
    window.localStorage.setItem("bdcr7-import-tags", JSON.stringify(next));
  }, []);

  const tagFor = useCallback(
    (lcNumber: string) => tagsByLc[lcNumber] || { category: "Raw Materials", subcategory: "Cement" },
    [tagsByLc]
  );

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
    let dbErr: Error | null = null;
    // OLD (DISABLED - SAFE)
    // const { error: dbErr } = await supabase.from("lc_records").insert({
    //   supplier_name: form.supplier_name.trim(),
    //   lc_number: form.lc_number.trim(),
    //   currency: form.currency,
    //   amount: parseFloat(form.amount),
    //   expected_arrival: form.expected_arrival,
    //   status: form.status,
    //   created_by: null,
    // });
    try {
      await apiClient<{ id?: string }>("/api/import-supply/lc-records", {
        method: "POST",
        body: JSON.stringify({
          supplier_name: form.supplier_name.trim(),
          lc_number: form.lc_number.trim(),
          currency: form.currency,
          amount: parseFloat(form.amount),
          expected_arrival: form.expected_arrival,
          status: form.status,
          created_by: null,
        }),
      });
      console.log("API WRITE USED - SAFE MODE (IMPORT)");
    } catch (err) {
      dbErr = err as Error;
    }
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    saveTags({
      ...tagsByLc,
      [form.lc_number.trim()]: {
        category: form.category,
        subcategory: form.subcategory,
      },
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchRecords();
  };

  const deleteRecord = async (id: string) => {
    // OLD (DISABLED - FINAL)
    // await supabase.from("lc_records").delete().eq("id", id);
    await apiClient<{}>(`/api/import-supply/lc-records/${id}`, { method: "DELETE" });
    console.log("API WRITE USED - PHASE 2 COMPLETE");
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const updateTag = (lcNumber: string, category: SupplyCategory, subcategory: string) => {
    saveTags({
      ...tagsByLc,
      [lcNumber]: { category, subcategory },
    });
  };

  const updateStatus = async (id: string, status: LCStatus) => {
    // OLD (DISABLED - SAFE)
    // await supabase.from("lc_records").update({ status }).eq("id", id);
    await apiClient<{ id?: string; status?: LCStatus }>(`/api/import-supply/lc-records/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    console.log("API WRITE USED - SAFE MODE (IMPORT)");
    setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const totalValue = records.reduce((s, r) => s + r.amount, 0);
  const openCount = records.filter((r) => r.status === "open" || r.status === "processing").length;
  const categoryCounts = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of records) {
      const category = tagFor(row.lc_number).category;
      totals[category] = (totals[category] || 0) + 1;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [records, tagFor]);

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

      <div className="grid gap-3 lg:grid-cols-4">
        {Object.entries(SUPPLY_TAXONOMY).map(([category, children]) => {
          const total = categoryCounts.find(([name]) => name === category)?.[1] || 0;
          return (
            <div key={category} className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Category</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{category}</p>
              <p className="mt-1 text-xs text-muted-foreground">{children.slice(0, 3).join(" • ")}</p>
              <p className="mt-3 text-xs text-primary">{total} active records</p>
            </div>
          );
        })}
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
                    <label htmlFor="lc-supplier-name" className="text-xs text-muted-foreground">Supplier Name *</label>
                    <input
                      id="lc-supplier-name"
                      title="Supplier Name"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.supplier_name} onChange={set("supplier_name")}
                      placeholder="e.g. China Steel Co."
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-number" className="text-xs text-muted-foreground">L/C Number *</label>
                    <input
                      id="lc-number"
                      title="L/C Number"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.lc_number} onChange={set("lc_number")}
                      placeholder="e.g. LC-2025-001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-currency" className="text-xs text-muted-foreground">Currency *</label>
                    <select
                      id="lc-currency"
                      title="Currency"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.currency} onChange={set("currency")}
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-amount" className="text-xs text-muted-foreground">Amount *</label>
                    <input
                      id="lc-amount"
                      title="Amount"
                      type="number" min="0" step="0.01"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.amount} onChange={set("amount")}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-expected-arrival" className="text-xs text-muted-foreground">Expected Arrival *</label>
                    <input
                      id="lc-expected-arrival"
                      title="Expected Arrival"
                      type="date"
                      placeholder="YYYY-MM-DD"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.expected_arrival} onChange={set("expected_arrival")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-status" className="text-xs text-muted-foreground">Status</label>
                    <select
                      id="lc-status"
                      title="Status"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.status} onChange={set("status")}
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-category" className="text-xs text-muted-foreground">Category *</label>
                    <select
                      id="lc-category"
                      title="Category"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.category}
                      onChange={(e) => {
                        const category = e.target.value as SupplyCategory;
                        setForm((prev) => ({
                          ...prev,
                          category,
                          subcategory: SUPPLY_TAXONOMY[category][0],
                        }));
                      }}
                    >
                      {Object.keys(SUPPLY_TAXONOMY).map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lc-subcategory" className="text-xs text-muted-foreground">Subcategory *</label>
                    <select
                      id="lc-subcategory"
                      title="Subcategory"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                      value={form.subcategory}
                      onChange={set("subcategory")}
                    >
                      {SUPPLY_TAXONOMY[form.category].map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
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
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Subcategory</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Arrival</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const tag = tagFor(r.lc_number);
                    return (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2.5 pr-4 font-mono text-xs text-foreground">{r.lc_number}</td>
                        <td className="py-2.5 pr-4 font-medium text-foreground">{r.supplier_name}</td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">{tag.category}</td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">{tag.subcategory}</td>
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
                          <ActionMenu
                            items={[
                              { label: `Category: ${tag.category}`, onClick: () => {} },
                              { label: `Subcategory: ${tag.subcategory}`, onClick: () => {} },
                              {
                                label: "Set Status: Processing",
                                onClick: () => {
                                  void updateStatus(r.id, "processing");
                                },
                              },
                              {
                                label: "Set Status: Shipped",
                                onClick: () => {
                                  void updateStatus(r.id, "shipped");
                                },
                              },
                              {
                                label: "Set Status: Cleared",
                                onClick: () => {
                                  void updateStatus(r.id, "cleared");
                                },
                              },
                              {
                                label: "Category -> Logistics / Customs",
                                onClick: () => {
                                  updateTag(r.lc_number, "Logistics", "Customs");
                                },
                              },
                              {
                                label: "Category -> Raw Materials / Cement",
                                onClick: () => {
                                  updateTag(r.lc_number, "Raw Materials", "Cement");
                                },
                              },
                              { label: "Delete Record", onClick: () => deleteRecord(r.id), tone: "danger" },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
