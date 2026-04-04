"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Building2,
  Package,
  Plus,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  barcode: string;
  purchase_price: number;
  sell_price: number;
  stock_qty: number;
  created_at: string;
};

type WarehouseRow = {
  id: string;
  name: string;
  location: string | null;
  manager: string | null;
  notes: string | null;
  created_at: string;
};

type StockAdjustment = {
  id: string;
  product_id: string;
  warehouse_id: string | null;
  adjustment_type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  adjustment_date: string;
  created_at: string;
  products?: { name: string; barcode: string } | null;
  warehouses?: { name: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const FIELD =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition";

const ADJ_COLORS: Record<string, string> = {
  in:         "bg-emerald-500",
  out:        "bg-rose-500",
  transfer:   "bg-sky-500",
  adjustment: "bg-amber-500",
};

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-xs rounded-2xl border border-rose-500/30 p-6 shadow-xl">
        <p className="text-sm font-semibold text-foreground">Delete {label}?</p>
        <p className="mt-1 text-xs text-muted-foreground">This cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600">
            Delete
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Product Form ──────────────────────────────────────────────────────────

function AddProductForm({
  supabase,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  onSaved: () => void;
}) {
  const [name, setName]             = useState("");
  const [barcode, setBarcode]       = useState("");
  const [purchasePrice, setPP]      = useState("0");
  const [sellPrice, setSP]          = useState("0");
  const [stockQty, setStockQty]     = useState("0");
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      name: name.trim(),
      barcode: barcode.trim(),
      purchase_price: Number(purchasePrice),
      sell_price: Number(sellPrice),
      stock_qty: Number(stockQty),
    });
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setMsg("পণ্য সংরক্ষিত হয়েছে।");
    setName(""); setBarcode(""); setPP("0"); setSP("0"); setStockQty("0");
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input className={FIELD} required value={name} onChange={(e) => setName(e.target.value)} placeholder="পণ্যের নাম / Product Name *" />
      <input className={FIELD} required value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="বারকোড / Barcode *" />
      <input className={FIELD} type="number" min="0" step="0.01" required value={purchasePrice} onChange={(e) => setPP(e.target.value)} placeholder="ক্রয় মূল্য / Purchase Price (৳) *" />
      <input className={FIELD} type="number" min="0" step="0.01" required value={sellPrice} onChange={(e) => setSP(e.target.value)} placeholder="বিক্রয় মূল্য / Sell Price (৳) *" />
      <input className={`${FIELD} md:col-span-2`} type="number" min="0" step="0.01" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="প্রারম্ভিক স্টক / Initial Stock Qty" />
      <button type="submit" disabled={saving}
        className="md:col-span-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
        {saving ? "সংরক্ষণ হচ্ছে..." : "পণ্য সংরক্ষণ করুন / Save Product"}
      </button>
      {msg && <p className="md:col-span-2 text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

// ─── Add Warehouse Form ────────────────────────────────────────────────────────

function AddWarehouseForm({
  supabase,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  onSaved: () => void;
}) {
  const [name, setName]         = useState("");
  const [location, setLocation] = useState("");
  const [manager, setManager]   = useState("");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("warehouses").insert({
      name: name.trim(),
      location: location.trim() || null,
      manager: manager.trim() || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setMsg("গুদাম সংরক্ষিত হয়েছে।");
    setName(""); setLocation(""); setManager(""); setNotes("");
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input className={FIELD} required value={name} onChange={(e) => setName(e.target.value)} placeholder="গুদামের নাম / Warehouse Name *" />
      <input className={FIELD} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ঠিকানা / Location" />
      <input className={FIELD} value={manager} onChange={(e) => setManager(e.target.value)} placeholder="ম্যানেজার / Manager" />
      <textarea className={`${FIELD} md:col-span-2 resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="নোট / Notes (optional)" />
      <button type="submit" disabled={saving}
        className="md:col-span-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
        {saving ? "সংরক্ষণ হচ্ছে..." : "গুদাম সংরক্ষণ করুন / Save Warehouse"}
      </button>
      {msg && <p className="md:col-span-2 text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

// ─── Add Adjustment Form ───────────────────────────────────────────────────────

function AddAdjustmentForm({
  supabase,
  products,
  warehouses,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  products: Product[];
  warehouses: WarehouseRow[];
  onSaved: () => void;
}) {
  const [productId, setProductId]   = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [adjType, setAdjType]       = useState("in");
  const [quantity, setQuantity]     = useState("0");
  const [reference, setReference]   = useState("");
  const [notes, setNotes]           = useState("");
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId) { setMsg("পণ্য নির্বাচন করুন।"); return; }
    setSaving(true);
    const { error: adjErr } = await supabase.from("stock_adjustments").insert({
      product_id: productId,
      warehouse_id: warehouseId || null,
      adjustment_type: adjType,
      quantity: Number(quantity),
      reference: reference.trim() || null,
      notes: notes.trim() || null,
      adjustment_date: date,
    });
    if (adjErr) { setSaving(false); setMsg(adjErr.message); return; }

    // Update stock_qty on the products table
    const product = products.find((p) => p.id === productId);
    if (product) {
      const delta = adjType === "out" ? -Number(quantity) : Number(quantity);
      const { error: stockErr } = await supabase
        .from("products")
        .update({ stock_qty: Math.max(0, Number(product.stock_qty) + delta) })
        .eq("id", productId);
      if (stockErr) {
        setSaving(false);
        setMsg(`সমন্বয় সংরক্ষিত হয়েছে, কিন্তু স্টক আপডেট ব্যর্থ: ${stockErr.message}`);
        onSaved();
        return;
      }
    }

    setSaving(false);
    setMsg("স্টক সমন্বয় সংরক্ষিত হয়েছে।");
    setProductId(""); setWarehouseId(""); setQuantity("0"); setReference(""); setNotes("");
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <select className={`${FIELD} md:col-span-2`} title="Product" value={productId} onChange={(e) => setProductId(e.target.value)} required>
        <option value="">— পণ্য নির্বাচন করুন / Select Product —</option>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty})</option>)}
      </select>
      <select className={FIELD} title="Warehouse (optional)" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
        <option value="">— গুদাম (ঐচ্ছিক) / Warehouse —</option>
        {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <select className={FIELD} title="Adjustment Type" value={adjType} onChange={(e) => setAdjType(e.target.value)}>
        <option value="in">In (প্রবেশ)</option>
        <option value="out">Out (বের)</option>
        <option value="transfer">Transfer (স্থানান্তর)</option>
        <option value="adjustment">Adjustment (সমন্বয়)</option>
      </select>
      <input className={FIELD} type="number" min="0" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="পরিমাণ / Quantity *" />
      <input className={FIELD} type="date" value={date} onChange={(e) => setDate(e.target.value)} title="Adjustment Date" />
      <input className={FIELD} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="রেফারেন্স / Reference (PO#, etc.)" />
      <input className={`${FIELD} md:col-span-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="নোট / Notes (optional)" />
      <button type="submit" disabled={saving}
        className="md:col-span-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
        {saving ? "সংরক্ষণ হচ্ছে..." : "স্টক সমন্বয় করুন / Save Adjustment"}
      </button>
      {msg && <p className="md:col-span-2 text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

// ─── Barcode Lookup ────────────────────────────────────────────────────────────

function BarcodeLookup({
  products,
}: {
  products: Product[];
}) {
  const [query, setQuery] = useState("");
  const result = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return products.find((p) => p.barcode.toLowerCase() === q || p.name.toLowerCase().includes(q)) ?? null;
  }, [query, products]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className={FIELD}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="বারকোড বা পণ্যের নাম / Barcode or Product Name"
        />
        <button type="button" className="shrink-0 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          <Search className="h-4 w-4" />
        </button>
      </div>
      {query.trim() && (
        result ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Barcode className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{result.name}</p>
                <p className="text-xs text-muted-foreground">{result.barcode}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "স্টক", value: String(result.stock_qty) },
                { label: "ক্রয় মূল্য", value: fmt(result.purchase_price) },
                { label: "বিক্রয় মূল্য", value: fmt(result.sell_price) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-base font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">কোনো পণ্য পাওয়া যায়নি।</p>
        )
      )}
    </div>
  );
}

// ─── Main InventoryView ────────────────────────────────────────────────────────

export function InventoryView() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts]         = useState<Product[]>([]);
  const [warehouses, setWarehouses]     = useState<WarehouseRow[]>([]);
  const [adjustments, setAdjustments]   = useState<StockAdjustment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("Add Product");
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null);
  const [deleteError, setDeleteError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, whRes, adjRes] = await Promise.all([
      supabase.from("products").select("*").order("name").limit(200),
      supabase.from("warehouses").select("*").order("name").limit(100),
      supabase.from("stock_adjustments").select("*, products(name, barcode), warehouses(name)").order("adjustment_date", { ascending: false }).limit(100),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setWarehouses((whRes.data as WarehouseRow[]) || []);
    setAdjustments((adjRes.data as StockAdjustment[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((s, p) => s + Number(p.stock_qty) * Number(p.sell_price), 0);
    const lowStock = products.filter((p) => Number(p.stock_qty) <= 5).length;
    return { totalProducts: products.length, totalWarehouses: warehouses.length, totalValue, lowStock };
  }, [products, warehouses]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    let error: { message: string } | null = null;
    if (type === "product") {
      ({ error } = await supabase.from("products").delete().eq("id", id));
    } else if (type === "warehouse") {
      ({ error } = await supabase.from("warehouses").delete().eq("id", id));
    } else if (type === "adjustment") {
      ({ error } = await supabase.from("stock_adjustments").delete().eq("id", id));
    }
    if (error) { setDeleteError(error.message); setDeleteTarget(null); return; }
    setDeleteTarget(null);
    void load();
  }, [deleteTarget, supabase, load]);

  const tabs = ["Add Product", "Products", "Barcode", "Add Warehouse", "Warehouses", "Stock Adjustment", "Adjustments"];

  return (
    <div className="space-y-4">
      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.label} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
      {deleteError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)} className="ml-3 shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      <WorkspaceHero
        badge="Inventory / ইনভেন্টরি"
        stats={[
          { label: "মোট পণ্য", value: String(stats.totalProducts) },
          { label: "গুদাম", value: String(stats.totalWarehouses) },
          { label: "মোট স্টক মূল্য", value: fmt(stats.totalValue) },
          { label: "কম স্টক", value: String(stats.lowStock) },
        ]}
      />

      <div className="flex justify-end">
        <ExportPDFButton
          onBuildOptions={() => ({
            moduleName: "Inventory Advanced",
            moduleNameBn: "অ্যাডভান্সড ইনভেন্টরি",
            description: "Full product catalog with stock levels, warehouse locations and adjustment history.",
            descriptionBn: "পণ্য ক্যাটালগ, স্টক পর্যায়, গুদাম ও সমন্বয়ের ইতিহাস।",
            sections: [
              {
                title: "Inventory Overview",
                titleBn: "ইনভেন্টরি সারসংক্ষেপ",
                rows: [
                  { label: "Total Products", labelBn: "মোট পণ্য", value: String(stats.totalProducts) },
                  { label: "Total Warehouses", labelBn: "মোট গুদাম", value: String(stats.totalWarehouses) },
                  { label: "Total Stock Value", labelBn: "মোট স্টক মূল্য", value: fmt(stats.totalValue) },
                  { label: "Low Stock Items (≤5)", labelBn: "কম স্টক (≤৫)", value: String(stats.lowStock) },
                ],
              },
              {
                title: "Product Catalog",
                titleBn: "পণ্য ক্যাটালগ",
                rows: [],
                tableHeaders: ["Product", "Barcode", "Stock", "Purchase", "Sell"],
                tableHeadersBn: ["পণ্য", "বারকোড", "স্টক", "ক্রয় মূল্য", "বিক্রয় মূল্য"],
                tableRows: products.slice(0, 25).map((p) => [
                  p.name,
                  p.barcode,
                  String(p.stock_qty),
                  fmt(p.purchase_price),
                  fmt(p.sell_price),
                ]),
              },
            ],
          })}
        />
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* ── Add Product ── */}
      {activeTab === "Add Product" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-primary" />
              নতুন পণ্য যোগ করুন / Add New Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddProductForm supabase={supabase} onSaved={load} />
          </CardContent>
        </Card>
      )}

      {/* ── Products ── */}
      {activeTab === "Products" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary" />
              পণ্য তালিকা / Product Catalog
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
            ) : products.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">কোনো পণ্য নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>পণ্য</Th>
                      <Th>বারকোড</Th>
                      <Th>স্টক</Th>
                      <Th>ক্রয় মূল্য</Th>
                      <Th>বিক্রয় মূল্য</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <Td className="font-medium">{p.name}</Td>
                        <Td className="text-xs font-mono text-muted-foreground">{p.barcode}</Td>
                        <Td className={`text-xs font-semibold ${Number(p.stock_qty) <= 5 ? "text-rose-500" : "text-emerald-600"}`}>
                          {p.stock_qty}
                        </Td>
                        <Td className="text-xs">{fmt(p.purchase_price)}</Td>
                        <Td className="text-xs">{fmt(p.sell_price)}</Td>
                        <Td>
                          <button type="button" title="Delete product"
                            onClick={() => setDeleteTarget({ type: "product", id: p.id, label: p.name })}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Barcode ── */}
      {activeTab === "Barcode" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Barcode className="h-4 w-4 text-primary" />
              বারকোড খোঁজ / Barcode Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeLookup products={products} />
          </CardContent>
        </Card>
      )}

      {/* ── Add Warehouse ── */}
      {activeTab === "Add Warehouse" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-primary" />
              নতুন গুদাম যোগ করুন / Add New Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddWarehouseForm supabase={supabase} onSaved={load} />
          </CardContent>
        </Card>
      )}

      {/* ── Warehouses ── */}
      {activeTab === "Warehouses" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Warehouse className="h-4 w-4 text-primary" />
              গুদাম তালিকা / Warehouse List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
            ) : warehouses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">কোনো গুদাম নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>নাম</Th>
                      <Th>ঠিকানা</Th>
                      <Th>ম্যানেজার</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => (
                      <tr key={w.id}>
                        <Td className="font-medium">{w.name}</Td>
                        <Td className="text-xs text-muted-foreground">{w.location ?? "—"}</Td>
                        <Td className="text-xs text-muted-foreground">{w.manager ?? "—"}</Td>
                        <Td>
                          <button type="button" title="Delete warehouse"
                            onClick={() => setDeleteTarget({ type: "warehouse", id: w.id, label: w.name })}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Stock Adjustment ── */}
      {activeTab === "Stock Adjustment" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              স্টক সমন্বয় / Stock Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddAdjustmentForm supabase={supabase} products={products} warehouses={warehouses} onSaved={load} />
          </CardContent>
        </Card>
      )}

      {/* ── Adjustments ── */}
      {activeTab === "Adjustments" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary" />
              সমন্বয়ের ইতিহাস / Adjustment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
            ) : adjustments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">কোনো সমন্বয় নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>পণ্য</Th>
                      <Th>গুদাম</Th>
                      <Th>ধরন</Th>
                      <Th>পরিমাণ</Th>
                      <Th>তারিখ</Th>
                      <Th>রেফারেন্স</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map((a) => (
                      <tr key={a.id}>
                        <Td className="font-medium">{a.products?.name ?? "—"}</Td>
                        <Td className="text-xs text-muted-foreground">{a.warehouses?.name ?? "—"}</Td>
                        <Td>
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${ADJ_COLORS[a.adjustment_type] ?? "bg-muted"}`} />
                            <span className="text-xs capitalize">{a.adjustment_type}</span>
                          </span>
                        </Td>
                        <Td className="text-xs font-semibold">{a.quantity}</Td>
                        <Td className="text-xs">{a.adjustment_date}</Td>
                        <Td className="text-xs text-muted-foreground">{a.reference ?? "—"}</Td>
                        <Td>
                          <button type="button" title="Delete adjustment"
                            onClick={() => setDeleteTarget({ type: "adjustment", id: a.id, label: `${a.products?.name ?? "adjustment"} — ${a.adjustment_date}` })}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
