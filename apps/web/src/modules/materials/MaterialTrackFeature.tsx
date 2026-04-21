// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Package, RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { EvidenceGate, type EvidenceGateFileReady } from "@/components/ui/EvidenceGate";

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

interface MovementRow {
  id: string;
  material_name: string;
  movement_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_cost: number;
  supplier?: string;
  created_at: string;
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = String(r[h] ?? "");
        return val.includes(",") || val.includes('"') ? `"${val.replaceAll('"', '""')}"` : val;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function MaterialTrackFeature() {
  const supabase = useMemo(() => createClient(), []);

  const [materialName, setMaterialName] = useState("");
  const [movementType, setMovementType] = useState<MovementType>("in");
  const [quantity, setQuantity]         = useState("0");
  const [unit, setUnit]                 = useState<Unit>("Pcs");
  const [unitPrice, setUnitPrice]       = useState("0");
  const [supplier, setSupplier]         = useState("");
  const [notes, setNotes]               = useState("");
  const [message, setMessage]           = useState("");
  const [stockList, setStockList]       = useState<StockRow[]>([]);
  const [movements, setMovements]       = useState<MovementRow[]>([]);
  const [movLoading, setMovLoading]     = useState(false);
  const [stockQuery, setStockQuery]     = useState("");
  const [movementQuery, setMovementQuery] = useState("");
  const [movementFilter, setMovementFilter] = useState<"all" | MovementType>("all");

  // Evidence enforcement
  const [proofFileId, setProofFileId]   = useState<string | null>(null);

  // Evidence only required for 'in' movements (deliveries)
  const evidenceRequired = movementType === "in";

  const totalCost = useMemo(
    () => Number(quantity || 0) * Number(unitPrice || 0),
    [quantity, unitPrice],
  );

  const filteredStockList = useMemo(() => {
    const normalized = stockQuery.trim().toLowerCase();
    if (!normalized) return stockList;
    return stockList.filter((item) => item.material_name.toLowerCase().includes(normalized));
  }, [stockList, stockQuery]);

  const filteredMovements = useMemo(() => {
    const normalized = movementQuery.trim().toLowerCase();
    return movements.filter((item) => {
      const type = String(item.movement_type).toLowerCase() as MovementType;
      if (movementFilter !== "all" && type !== movementFilter) return false;
      if (!normalized) return true;
      const haystack = [item.material_name, item.supplier || "", item.movement_type, item.created_at]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [movements, movementFilter, movementQuery]);

  const fetchStock = useCallback(async () => {
    const { data } = await supabase
      .from("materials_stock")
      .select("id,material_name,current_qty,unit,low_stock_threshold")
      .order("material_name");
    if (data) setStockList(data as StockRow[]);
  }, [supabase]);

  const fetchMovements = useCallback(async () => {
    setMovLoading(true);
    try {
      const { data } = await supabase
        .from("material_movements")
        .select("id,material_name,movement_type,quantity,unit,unit_price,total_cost,supplier,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setMovements((data as MovementRow[]) || []);
    } catch {
      // silently fail
    } finally {
      setMovLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchStock(); fetchMovements(); }, [fetchStock, fetchMovements]);

  const handleFileReady = ({ fileId }: EvidenceGateFileReady) => {
    setProofFileId(fileId);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Evidence enforcement for inbound deliveries
    if (evidenceRequired && !proofFileId) {
      setMessage("❌ Delivery proof required for IN movements. Upload receipt/photo first.");
      return;
    }

    const qty = Number(quantity);
    const { error } = await supabase.rpc("record_material_movement_atomic", {
      p_project_id: null,
      p_material_name: materialName,
      p_quantity: movementType === "adjust" ? qty : Math.abs(qty),
      p_unit: unit,
      p_unit_price: Number(unitPrice),
      p_supplier: supplier.trim() || null,
      p_notes: notes.trim() || null,
      p_movement_type: movementType,
      p_proof_file_id: proofFileId || null,
      p_actor_user_id: null,
    });
    if (error) { setMessage(error.message); return; }

    setMessage("✅ Movement saved.");
    setMaterialName(""); setQuantity("0"); setUnitPrice("0"); setSupplier(""); setNotes("");
    setProofFileId(null);
    fetchStock();
    fetchMovements();
  };

  return (
    <section className="module app-panel module-surface rounded-[1.2rem] border border-border/70 p-4 shadow-soft space-y-4 sm:p-5">
      <div className="app-section-head">
        <div>
          <h3 className="app-section-title">Material Tracking</h3>
          <p className="app-section-subtitle">Record IN / OUT / Adjust. Inbound requires delivery proof.</p>
        </div>
      </div>

      {/* Movement type selector first — determines if evidence is required */}
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground uppercase tracking-wide">Movement Type</label>
          <select
            className="app-select"
            title="Movement type"
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value as MovementType);
              setProofFileId(null);
            }}
          >
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground uppercase tracking-wide">Material Name</label>
          <input
            className="app-field"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            placeholder="Material Name" required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground uppercase tracking-wide">Unit</label>
          <select
            className="app-select"
            title="Unit" value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Evidence Gate — block inbound without delivery proof */}
      {evidenceRequired && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Delivery Proof (Required for IN)
          </p>
          <EvidenceGate
            module="materials"
            category="delivery"
            severity="block"
            label="Delivery note, photo, or challan required for inbound materials."
            onFileReady={handleFileReady}
            onCleared={() => { setProofFileId(null); }}
          />
        </div>
      )}

      {/* Main form */}
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="app-field"
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          required
        />
        <input
          className="app-field"
          type="number"
          min="0"
          step="0.01"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="Unit Price (৳)"
        />
        <input
          className="app-field"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier (optional)"
        />
        <textarea
          className="app-textarea resize-none md:col-span-2"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
        />
        <div className="app-panel-muted p-4 text-sm text-muted-foreground md:col-span-2">
          <p className="text-xs uppercase tracking-[0.14em]">Auto Total Cost</p>
          <p className="mt-1 text-xl font-semibold text-foreground">৳{totalCost.toFixed(2)}</p>
        </div>
        <button
          className={`rounded-2xl px-4 py-3 text-sm font-medium transition md:col-span-2 ${
            evidenceRequired && !proofFileId
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-95"
          }`}
          type="submit"
          disabled={evidenceRequired && !proofFileId}
        >
          {evidenceRequired && !proofFileId ? "⬆ Upload delivery proof to enable save" : "Save Movement"}
        </button>
      </form>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {/* Stock Levels */}
      {stockList.length > 0 && (
        <div className="mt-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Current Stock Levels</h4>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  `stock-levels-${new Date().toISOString().slice(0, 10)}.csv`,
                  stockList.map((s) => ({
                    material: s.material_name,
                    quantity: s.current_qty,
                    unit: s.unit,
                    low_stock_threshold: s.low_stock_threshold,
                    status: s.current_qty <= s.low_stock_threshold ? "LOW" : "OK",
                  }))
                )
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              <ArrowDownToLine className="h-3 w-3" /> CSV
            </button>
          </div>
          <div className="mb-3">
            <input
              value={stockQuery}
              onChange={(e) => setStockQuery(e.target.value)}
              placeholder="Search stock by material name..."
              className="app-field h-9 rounded-xl px-3 text-sm"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStockList.map((s) => {
              const low = s.current_qty <= s.low_stock_threshold;
              return (
                <div key={s.id} className={`app-panel-muted px-3 py-2.5 text-sm ${low ? "border-rose-200 bg-rose-50 dark:bg-rose-950/20" : "border-border/70 bg-muted/30"}`}>
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

      {/* Movement History */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground">সাম্প্রতিক মুভমেন্ট / Recent Movements</h4>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchMovements}
              disabled={movLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3 w-3 ${movLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  `material-movements-${new Date().toISOString().slice(0, 10)}.csv`,
                  filteredMovements.map((m) => ({
                    date: m.created_at?.slice(0, 10),
                    material: m.material_name,
                    type: m.movement_type,
                    quantity: m.quantity,
                    unit: m.unit,
                    unit_price: m.unit_price,
                    total_cost: m.total_cost,
                    supplier: m.supplier ?? "",
                  }))
                )
              }
              disabled={!filteredMovements.length}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <ArrowDownToLine className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={movementQuery}
            onChange={(e) => setMovementQuery(e.target.value)}
            placeholder="Search movement by material, supplier..."
            className="app-field h-9 min-w-0 w-full flex-1 rounded-xl px-3 text-sm sm:min-w-[230px]"
          />
          <div className="app-pill-group">
            {([
              ["all", "All"],
              ["in", "IN"],
              ["out", "OUT"],
              ["adjust", "ADJUST"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMovementFilter(value)}
                className={`app-pill ${movementFilter === value ? "app-pill-active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {movLoading ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">লোড হচ্ছে...</div>
        ) : !filteredMovements.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/75 px-4 py-6 text-center text-sm text-muted-foreground">
            বর্তমান ফিল্টারে কোনো মুভমেন্ট নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-4 whitespace-nowrap">তারিখ</th>
                  <th className="py-2 pr-4 whitespace-nowrap">উপকরণ</th>
                  <th className="py-2 pr-4 whitespace-nowrap">ধরন</th>
                  <th className="py-2 pr-4 whitespace-nowrap">পরিমাণ</th>
                  <th className="py-2 whitespace-nowrap">মোট</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{m.created_at?.slice(0, 10)}</td>
                    <td className="py-2 pr-4 font-medium text-foreground">{m.material_name}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${m.movement_type === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : m.movement_type === "out" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-muted text-muted-foreground"}`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{m.quantity} {m.unit}</td>
                    <td className="py-2 text-muted-foreground">৳{Number(m.total_cost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
