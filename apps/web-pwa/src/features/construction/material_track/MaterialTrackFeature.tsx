"use client";

import { FormEvent, useMemo, useState } from "react";

type MaterialRow = {
  material_name: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  total_cost: number;
};

export function MaterialTrackFeature() {
  const [materialName, setMaterialName] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unitPrice, setUnitPrice] = useState("0");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<MaterialRow[]>([]);

  const totalCost = useMemo(() => Number(quantity || 0) * Number(unitPrice || 0), [quantity, unitPrice]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const row: MaterialRow = {
      material_name: materialName,
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      supplier,
      total_cost: totalCost,
    };
    setRows((prev) => [row, ...prev]);
    setStock((prev) => ({ ...prev, [materialName]: (prev[materialName] || 0) + Number(quantity) }));
    setMaterialName("");
    setQuantity("0");
    setUnitPrice("0");
    setSupplier("");
  };

  return (
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">Material Tracking</h3>
        <p className="mt-1 text-sm text-muted-foreground">Monitor material intake, supplier details, and stock changes in a cleaner two-column layout.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={materialName} onChange={(e) => setMaterialName(e.target.value)} placeholder="Material Name" required />
        <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" required />
        <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Unit Price" required />
        <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier" required />
        <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground md:col-span-2">
          <p className="text-xs uppercase tracking-[0.14em]">Auto Total Cost</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{totalCost.toFixed(2)}</p>
        </div>
        <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 md:col-span-2" type="submit">Add Material Entry</button>
      </form>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Stock Updates</p>
          <div className="mt-3 space-y-2">
            {Object.keys(stock).length === 0 ? <p>No stock yet.</p> : null}
            {Object.entries(stock).map(([name, qty]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                <span>{name}</span>
                <span className="font-medium text-foreground">{qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/75 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Recent Materials</p>
          <div className="mt-3 space-y-2">
            {rows.slice(0, 8).map((item, idx) => (
              <div key={`${item.material_name}-${idx}`} className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                {item.material_name} | Qty {item.quantity} | Total {item.total_cost.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
