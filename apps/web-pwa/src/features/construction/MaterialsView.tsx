"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, ShoppingCart, TrendingDown, Warehouse } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("material_logs")
        .select("id,item_name,unit,quantity,movement_type,cost_per_unit,supplier,low_stock_threshold,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setMaterials((data as MaterialRow[]) || []);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const stats = useMemo(() => {
    const inbound = materials.filter((m) => m.movement_type === "in").reduce((s, m) => s + Number(m.quantity), 0);
    const outbound = materials.filter((m) => m.movement_type === "out").reduce((s, m) => s + Number(m.quantity), 0);
    const totalCost = materials.reduce((s, m) => s + (Number(m.cost_per_unit || 0) * Number(m.quantity)), 0);
    const lowStock = materials.filter(
      (m) => m.low_stock_threshold != null && m.quantity <= m.low_stock_threshold
    ).length;
    return { inbound, outbound, totalCost, lowStock };
  }, [materials]);

  const tabs = ["Log Entry", "Stock Log", "Low Stock"];

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Materials"
        title="Materials Management"
        description="Track purchase, stock levels, and supplier information"
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
    </div>
  );
}
