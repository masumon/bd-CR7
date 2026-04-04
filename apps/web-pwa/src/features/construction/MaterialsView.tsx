"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Pencil, ShoppingCart, Trash2, TrendingDown, Warehouse } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { MaterialTrackFeature } from "@/features/construction/material_track/MaterialTrackFeature";
import { createClient } from "@/lib/supabase/client";

type MaterialRow = {
  id: string;
  item_name: string;
  unit: string;
  quantity: number;
  movement_type: string;
  cost_per_unit: number | null;
  supplier: string | null;
  low_stock_threshold: number | null;
  created_at: string;
};

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const MOVEMENT_COLORS: Record<string, string> = {
  in: "bg-emerald-500",
  out: "bg-rose-500",
  adjust: "bg-amber-500",
};

export function MaterialsView() {
  const supabase = useMemo(() => createClient(), []);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Log Entry");
  const [editTarget, setEditTarget] = useState<MaterialRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [editForm, setEditForm] = useState({
    item_name: "", unit: "", quantity: 0, movement_type: "in",
    cost_per_unit: 0, supplier: "", low_stock_threshold: 0,
  });

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("material_logs")
      .select("id,item_name,unit,quantity,movement_type,cost_per_unit,supplier,low_stock_threshold,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setMaterials((data as MaterialRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const stats = useMemo(() => {
    const inbound = materials.filter((m) => m.movement_type === "in").reduce((s, m) => s + Number(m.quantity), 0);
    const outbound = materials.filter((m) => m.movement_type === "out").reduce((s, m) => s + Number(m.quantity), 0);
    const totalCost = materials.reduce((s, m) => s + (Number(m.cost_per_unit || 0) * Number(m.quantity)), 0);
    const lowStock = materials.filter(
      (m) => m.low_stock_threshold != null && m.quantity <= m.low_stock_threshold
    ).length;
    return { inbound, outbound, totalCost, lowStock };
  }, [materials]);

  const handleEditOpen = (m: MaterialRow) => {
    setEditForm({
      item_name: m.item_name,
      unit: m.unit,
      quantity: Number(m.quantity),
      movement_type: m.movement_type,
      cost_per_unit: Number(m.cost_per_unit ?? 0),
      supplier: m.supplier ?? "",
      low_stock_threshold: Number(m.low_stock_threshold ?? 0),
    });
    setEditTarget(m);
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setMutationError("");
    const { error } = await supabase.from("material_logs").update({
      item_name: editForm.item_name,
      unit: editForm.unit,
      quantity: editForm.quantity,
      movement_type: editForm.movement_type,
      cost_per_unit: editForm.cost_per_unit,
      supplier: editForm.supplier,
      low_stock_threshold: editForm.low_stock_threshold,
    }).eq("id", editTarget.id);
    setSaving(false);
    if (error) { setMutationError(error.message); return; }
    setEditTarget(null);
    await loadMaterials();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setMutationError("");
    const { error } = await supabase.from("material_logs").delete().eq("id", deleteTarget);
    if (error) { setMutationError(error.message); return; }
    setDeleteTarget(null);
    await loadMaterials();
  };

  const tabs = ["Log Entry", "Stock Log", "Low Stock"];

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Materials"
        stats={[
          { label: "Inbound Units", value: String(stats.inbound) },
          { label: "Outbound Units", value: String(stats.outbound) },
          { label: "Total Value", value: fmt(stats.totalCost) },
        ]}
      />

      <div className="flex justify-end">
        <ExportPDFButton
          onBuildOptions={() => ({
            moduleName: "Materials",
            moduleNameBn: "উপকরণ ব্যবস্থাপনা",
            description: "Material stock register with inbound, outbound, and supplier information.",
            descriptionBn: "উপকরণ স্টক রেজিস্টার — প্রবেশ, বের এবং সরবরাহকারীর তথ্য।",
            sections: [
              {
                title: "Materials Overview",
                titleBn: "উপকরণ সারসংক্ষেপ",
                rows: [
                  { label: "Total Inbound (units)", labelBn: "মোট প্রবেশ (একক)", value: String(stats.inbound) },
                  { label: "Total Outbound (units)", labelBn: "মোট বের (একক)", value: String(stats.outbound) },
                  { label: "Total Stock Value", labelBn: "মোট স্টক মূল্য", value: fmt(stats.totalCost) },
                  { label: "Low Stock Items", labelBn: "কম স্টক আইটেম", value: String(stats.lowStock) },
                ],
              },
              {
                title: "Stock Register",
                titleBn: "স্টক রেজিস্টার",
                rows: [],
                tableHeaders: ["Item Name", "Qty", "Unit", "Type", "Cost/Unit", "Supplier"],
                tableHeadersBn: ["আইটেমের নাম", "পরিমাণ", "একক", "ধরন", "প্রতি একক মূল্য", "সরবরাহকারী"],
                tableRows: materials.slice(0, 25).map((m) => [
                  m.item_name,
                  String(m.quantity),
                  m.unit,
                  m.movement_type === "in" ? "IN প্রবেশ" : m.movement_type === "out" ? "OUT বের" : "Adjust",
                  m.cost_per_unit != null ? fmt(m.cost_per_unit) : "—",
                  m.supplier ?? "—",
                ]),
              },
            ],
          })}
        />
      </div>

      {stats.lowStock > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          <TrendingDown className="h-4 w-4 shrink-0" />
          <span>
            <strong>{stats.lowStock}</strong> item{stats.lowStock > 1 ? "s" : ""} below low-stock threshold
          </span>
        </div>
      )}

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === "Log Entry" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Material Movement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialTrackFeature />
          </CardContent>
        </Card>
      )}

      {activeTab === "Stock Log" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Warehouse className="h-4 w-4 text-primary" />
              Stock Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : materials.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No material records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Item</Th>
                      <Th>Qty</Th>
                      <Th>Unit</Th>
                      <Th>Type</Th>
                      <Th>Supplier</Th>
                      <Th className="w-20 text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <Td>{m.item_name}</Td>
                        <Td className="text-xs">{m.quantity}</Td>
                        <Td className="text-xs text-muted-foreground">{m.unit}</Td>
                        <Td>
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${MOVEMENT_COLORS[m.movement_type] ?? "bg-muted"}`} />
                            <span className="text-xs capitalize">{m.movement_type}</span>
                          </span>
                        </Td>
                        <Td className="text-xs text-muted-foreground">{m.supplier || "—"}</Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditOpen(m)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(m.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      {activeTab === "Low Stock" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                {materials
                  .filter((m) => m.low_stock_threshold != null && m.quantity <= m.low_stock_threshold)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.item_name}</p>
                        <p className="text-xs text-muted-foreground">Threshold: {m.low_stock_threshold} {m.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">{m.quantity} {m.unit}</p>
                        <p className="text-xs text-muted-foreground">In stock</p>
                      </div>
                    </div>
                  ))}
                {materials.filter((m) => m.low_stock_threshold != null && m.quantity <= m.low_stock_threshold).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">All stock levels are healthy.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editTarget && (
        <Dialog open title="Edit Material" onClose={() => setEditTarget(null)}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Item Name</label>
              <input type="text" value={editForm.item_name}
                onChange={(e) => setEditForm((f) => ({ ...f, item_name: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Unit</label>
                <input type="text" value={editForm.unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Quantity</label>
                <input type="number" value={editForm.quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Movement Type</label>
              <select value={editForm.movement_type}
                onChange={(e) => setEditForm((f) => ({ ...f, movement_type: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition">
                <option value="in">In</option>
                <option value="out">Out</option>
                <option value="adjust">Adjust</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Cost / Unit</label>
                <input type="number" value={editForm.cost_per_unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, cost_per_unit: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Low Stock Threshold</label>
                <input type="number" value={editForm.low_stock_threshold}
                  onChange={(e) => setEditForm((f) => ({ ...f, low_stock_threshold: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Supplier</label>
              <input type="text" value={editForm.supplier}
                onChange={(e) => setEditForm((f) => ({ ...f, supplier: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleEditSubmit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            </div>
          </div>
        </Dialog>
      )}

      {deleteTarget && (
        <Dialog open title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this material log? This action cannot be undone.</p>
          {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
          <div className="flex gap-2">
            <Button onClick={handleDelete}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
