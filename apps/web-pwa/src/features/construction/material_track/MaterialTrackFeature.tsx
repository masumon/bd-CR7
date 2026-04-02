"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const MOVEMENT_TYPES = ["in", "out", "adjust"] as const;
type MovementType = (typeof MOVEMENT_TYPES)[number];

const UNIT_OPTIONS = ["Pcs", "KG", "Ton", "Bag", "Bundle", "Liter", "Sqft", "Rft", "Other"] as const;
type Unit = (typeof UNIT_OPTIONS)[number];

interface StockRow {
  id: string;
  material_name: string;
  current_qty: number;
  unit: string;
  low_stock_threshold: number;
}

export function MaterialTrackFeature() {
  const supabase = createClient();

  const [materialName, setMaterialName] = useState("");
  const [movementType, setMovementType] = useState<MovementType>("in");
  const [quantity, setQuantity]         = useState("0");
  const [unit, setUnit]                 = useState<Unit>("Pcs");
  const [unitPrice, setUnitPrice]       = useState("0");
  const [supplier, setSupplier]         = useState("");
  const [notes, setNotes]               = useState("");
  const [message, setMessage]           = useState("");
  const [stockList, setStockList]       = useState<StockRow[]>([]);

  const totalCost = useMemo(
    () => Number(quantity || 0) * Number(unitPrice || 0),
    [quantity, unitPrice],
  );

  async function fetchStock() {
    const { data } = await supabase
      .from("materials_stock")
      .select("id,material_name,current_qty,unit,low_stock_threshold")
      .order("material_name");
    if (data) setStockList(data as StockRow[]);
  }

  useEffect(() => { fetchStock(); }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const qty = Number(quantity);
    const { error } = await supabase.from("material_movements").insert({
      material_name: materialName,
      movement_type: movementType,
      quantity:      qty,
      unit,
      unit_price:    Number(unitPrice),
      total_cost:    qty * Number(unitPrice),
      supplier:      supplier.trim() || null,
      notes:         notes.trim() || null,
    });
    if (error) { setMessage(error.message); return; }
    if (movementType === "in") {
      const existing = stockList.find((s) => s.material_name === materialName);
      if (existing) {
        await supabase.from("materials_stock").update({ current_qty: existing.current_qty + qty }).eq("id", existing.id);
      } else {
        await supabase.from("materials_stock").insert({ material_name: materialName, unit, current_qty: qty, low_stock_threshold: 5 });
      }
    } else if (movementType === "out") {
      const existing = stockList.find((s) => s.material_name === materialName);
      if (existing) {
        await supabase.from("materials_stock").update({ current_qty: Math.max(0, existing.current_qty - qty) }).eq("id", existing.id);
      }
    }
    setMessage("Movement saved.");
    setMaterialName(""); setQuantity("0"); setUnitPrice("0"); setSupplier(""); setNotes("");
    fetchStock();
  };

  return (
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">Material Tracking</h3>
          <p className="mt-1 text-sm text-muted-foreground">Record IN / OUT / Adjust movements and track live stock levels.</p>
      </div>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={materialName} onChange={(e) => setMaterialName(e.target.value)} placeholder="Material Name" required />
          <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Movement type" value={movementType} onChange={(e) => setMovementType(e.target.value as MovementType)}>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" required />
          <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Unit Price (৳)" />
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier (optional)" />
          <textarea className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none resize-none md:col-span-2" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground md:col-span-2">
            <p className="text-xs uppercase tracking-[0.14em]">Auto Total Cost</p>
            <p className="mt-1 text-xl font-semibold text-foreground">৳{totalCost.toFixed(2)}</p>
          </div>
          <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 md:col-span-2" type="submit">Save Movement</button>
        </form>
        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}

        {stockList.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Current Stock Levels</h4>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {stockList.map((s) => {
                const low = s.current_qty <= s.low_stock_threshold;
                return (
                  <div key={s.id} className={`rounded-xl border px-3 py-2.5 text-sm ${low ? "border-rose-200 bg-rose-50 dark:bg-rose-950/20" : "border-border/70 bg-muted/30"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">{s.material_name}</span>
                      {low && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
                    </div>
                    <p className={`mt-0.5 text-xs ${low ? "text-rose-600" : "text-muted-foreground"}`}>
                      {s.current_qty} {s.unit}{low ? " — Low Stock" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </section>
  );
}
