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
    <section className="module">
      <h3>Material Tracking</h3>
      <form onSubmit={onSubmit} className="formGrid">
        <input value={materialName} onChange={(e) => setMaterialName(e.target.value)} placeholder="Material Name" required />
        <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" required />
        <input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Unit Price" required />
        <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier" required />
        <p className="text-xs text-slate-600">Auto Total Cost: {totalCost.toFixed(2)}</p>
        <button type="submit">Add Material Entry</button>
      </form>

      <div className="mt-3 text-xs text-slate-700">
        <p className="font-semibold">Stock Updates</p>
        {Object.keys(stock).length === 0 ? <p>No stock yet.</p> : null}
        {Object.entries(stock).map(([name, qty]) => (
          <p key={name}>{name}: {qty}</p>
        ))}
      </div>

      <div className="mt-3 text-xs text-slate-700">
        <p className="font-semibold">Recent Materials</p>
        {rows.slice(0, 8).map((item, idx) => (
          <p key={`${item.material_name}-${idx}`}>{item.material_name} | Qty {item.quantity} | Total {item.total_cost.toFixed(2)}</p>
        ))}
      </div>
    </section>
  );
}
