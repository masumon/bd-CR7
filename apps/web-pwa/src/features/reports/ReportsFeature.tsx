"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  BarChart3,
  DollarSign,
  HardHat,
  Loader2,
  PackageCheck,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface ExpenseRow { id: string; amount: number; status: string; created_at: string; metadata?: Record<string, string>; }
interface WorkerRow { id: string; full_name?: string; worker_name?: string; role?: string; daily_rate?: number; }
interface MaterialRow { id: string; material_name: string; movement_type: string; quantity: number; unit: string; total_cost?: number; created_at: string; }
interface FundRow { id: string; amount: number; direction: string; created_at: string; }

interface ReportSummary {
  totalFunds: number;
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  totalWorkers: number;
  totalMaterialIn: number;
  totalMaterialOut: number;
  materialCost: number;
  recentExpenses: ExpenseRow[];
  recentMaterials: MaterialRow[];
}

const EMPTY: ReportSummary = {
  totalFunds: 0, totalExpenses: 0, pendingExpenses: 0, approvedExpenses: 0,
  totalWorkers: 0, totalMaterialIn: 0, totalMaterialOut: 0, materialCost: 0,
  recentExpenses: [], recentMaterials: [],
};

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString("en-BD")}`;
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsFeature() {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<ReportSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const [expRes, workerRes, matRes, fundRes] = await Promise.all([
      supabase.from("expenses").select("id,amount,status,created_at,metadata").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("attendance").select("id,worker_name,role").gte("date", sinceISO.slice(0, 10)),
      supabase.from("material_movements").select("id,material_name,movement_type,quantity,unit,total_cost,created_at").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("fund_transactions").select("id,amount,direction,created_at").gte("created_at", sinceISO),
    ]);

    const expenses = (expRes.data || []) as ExpenseRow[];
    const workers = (workerRes.data || []) as WorkerRow[];
    const materials = (matRes.data || []) as MaterialRow[];
    const funds = (fundRes.data || []) as FundRow[];

    setData({
      totalFunds: funds.filter((f) => f.direction === "credit").reduce((s, f) => s + f.amount, 0),
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      pendingExpenses: expenses.filter((e) => e.status === "pending").length,
      approvedExpenses: expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0),
      totalWorkers: new Set(workers.map((w) => w.worker_name || w.id)).size,
      totalMaterialIn: materials.filter((m) => m.movement_type === "in").reduce((s, m) => s + m.quantity, 0),
      totalMaterialOut: materials.filter((m) => m.movement_type === "out").reduce((s, m) => s + m.quantity, 0),
      materialCost: materials.reduce((s, m) => s + (m.total_cost || 0), 0),
      recentExpenses: expenses.slice(0, 20),
      recentMaterials: materials.slice(0, 20),
    });
    setLoading(false);
  }, [supabase, period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const statCards = [
    { label: "তহবিল প্রাপ্তি", sublabel: "Fund received", value: fmt(data.totalFunds), icon: TrendingUp, tone: "emerald" },
    { label: "মোট ব্যয়", sublabel: "Total expenses", value: fmt(data.totalExpenses), icon: TrendingDown, tone: "rose" },
    { label: "অনুমোদন বাকি", sublabel: "Pending approvals", value: String(data.pendingExpenses), icon: DollarSign, tone: "amber" },
    { label: "শ্রমিক উপস্থিতি", sublabel: "Unique workers logged", value: String(data.totalWorkers), icon: HardHat, tone: "blue" },
    { label: "উপকরণ IN", sublabel: "Material received (units)", value: String(data.totalMaterialIn), icon: PackageCheck, tone: "emerald" },
    { label: "উপকরণ OUT", sublabel: "Material issued (units)", value: String(data.totalMaterialOut), icon: BarChart3, tone: "rose" },
  ];

  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">রিপোর্ট ও বিশ্লেষণ</h2>
          <p className="mt-1 text-sm text-muted-foreground">Finance, Materials & Workers — real-time summary</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {p === "7d" ? "৭ দিন" : p === "30d" ? "৩০ দিন" : "৯০ দিন"}
            </button>
          ))}
          <Button
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={fetchReport}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Stat grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {statCards.map((card) => (
            <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
              <Card className="border-border/70">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneMap[card.tone]}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.sublabel}</p>
                    <p className="text-xl font-semibold text-foreground">{card.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Expense Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>ব্যয় তালিকা</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Recent expense records for this period</p>
          </div>
          <Button
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={() =>
              downloadCSV(
                `expenses-${period}.csv`,
                data.recentExpenses.map((e) => ({
                  id: e.id,
                  amount: e.amount,
                  status: e.status,
                  date: e.created_at?.slice(0, 10),
                  category: e.metadata?.["category"] ?? "",
                }))
              )
            }
          >
            <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          {!data.recentExpenses.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">এই সময়কালে কোনো ব্যয় নেই</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="py-2 pr-4">তারিখ</th>
                    <th className="py-2 pr-4">পরিমাণ</th>
                    <th className="py-2 pr-4">ক্যাটাগরি</th>
                    <th className="py-2">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentExpenses.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-4 text-muted-foreground">{e.created_at?.slice(0, 10)}</td>
                      <td className="py-2 pr-4 font-medium text-foreground">{fmt(e.amount)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{e.metadata?.["category"] || "—"}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${e.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                          {e.status === "approved" ? "অনুমোদিত" : "বাকি"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>উপকরণ চলাচল</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Material movement log for this period</p>
          </div>
          <Button
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={() =>
              downloadCSV(
                `materials-${period}.csv`,
                data.recentMaterials.map((m) => ({
                  date: m.created_at?.slice(0, 10),
                  material: m.material_name,
                  type: m.movement_type,
                  quantity: m.quantity,
                  unit: m.unit,
                  cost: m.total_cost ?? 0,
                }))
              )
            }
          >
            <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          {!data.recentMaterials.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">এই সময়কালে কোনো উপকরণ নড়াচড়া নেই</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="py-2 pr-4">তারিখ</th>
                    <th className="py-2 pr-4">উপকরণ</th>
                    <th className="py-2 pr-4">ধরন</th>
                    <th className="py-2 pr-4">পরিমাণ</th>
                    <th className="py-2">খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentMaterials.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-4 text-muted-foreground">{m.created_at?.slice(0, 10)}</td>
                      <td className="py-2 pr-4 font-medium text-foreground">{m.material_name}</td>
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${m.movement_type === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : m.movement_type === "out" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-muted text-muted-foreground"}`}>
                          {m.movement_type === "in" ? "IN প্রবেশ" : m.movement_type === "out" ? "OUT বের" : "Adjust"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{m.quantity} {m.unit}</td>
                      <td className="py-2 text-muted-foreground">{fmt(m.total_cost ?? 0)}</td>
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
