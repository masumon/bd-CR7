"use client";

/**
 * ERPModuleStatusGrid
 * ────────────────────────────────────────────────────
 * Cross-module stats panel for the Dashboard.
 * Fetches aggregated counts from all ERP modules and
 * displays them as a responsive status grid.
 *
 * Also shows:
 *  - Evidence enforcement compliance rate
 *  - AI auto-insertions applied today
 *  - Pending AI proposals waiting for review
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  HardHat,
  Loader2,
  Package,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ModuleStat {
  label: string;
  labelBn: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}

interface CrossModuleStats {
  projects: number;
  activeProjects: number;
  expenses: number;
  pendingExpenses: number;
  totalExpenseAmount: number;
  workers: number;
  presentToday: number;
  materials: number;
  lowStock: number;
  totalFiles: number;
  aiClassified: number;
  pendingProposals: number;
  aiAppliedToday: number;
  evidenceCompliance: number; // % of finance entries with proof_file_id
}

function pct(num: number, den: number): number {
  if (!den) return 100;
  return Math.round((num / den) * 100);
}

export function ERPModuleStatusGrid() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<CrossModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [
        projectsRes,
        expensesRes,
        attendanceRes,
        stockRes,
        filesRes,
        pendingProposalsRes,
        aiAppliedRes,
        expenseWithProofRes,
      ] = await Promise.all([
        // Projects
        supabase.from("projects").select("id,status", { count: "exact" }).limit(1000),
        // Expenses
        supabase.from("expenses").select("id,status,amount", { count: "exact" }).limit(1000),
        // Attendance today
        supabase.from("attendance").select("id,status").eq("date", today).limit(500),
        // Materials stock
        supabase.from("materials_stock").select("id,current_qty,low_stock_threshold").limit(500),
        // Project files
        supabase.from("project_files").select("id,ai_classified").eq("status", "active").limit(2000),
        // Pending AI proposals
        supabase.from("ai_auto_insertions")
          .select("id", { count: "exact" })
          .eq("auto_applied", false)
          .eq("rejected", false)
          .limit(1),
        // AI applied today
        supabase.from("ai_auto_insertions")
          .select("id", { count: "exact" })
          .eq("auto_applied", true)
          .gte("confirmed_at", `${today}T00:00:00Z`)
          .limit(1),
        // Expenses with proof file
        supabase.from("expenses")
          .select("id")
          .not("metadata->proof_file_id", "is", null)
          .limit(1000),
      ]);

      const projectData = projectsRes.data || [];
      const expenseData = expensesRes.data || [];
      const attendanceData = attendanceRes.data || [];
      const stockData = stockRes.data || [];
      const filesData = filesRes.data || [];

      const totalExpenseAmount = expenseData.reduce(
        (s, e) => s + (Number(e.amount) || 0), 0
      );

      setStats({
        projects: projectData.length,
        activeProjects: projectData.filter((p) => p.status === "Active").length,
        expenses: expenseData.length,
        pendingExpenses: expenseData.filter((e) => e.status === "pending").length,
        totalExpenseAmount,
        workers: attendanceData.length,
        presentToday: attendanceData.filter((a) => a.status === "present").length,
        materials: stockData.length,
        lowStock: stockData.filter((s) => s.current_qty <= s.low_stock_threshold).length,
        totalFiles: filesData.length,
        aiClassified: filesData.filter((f) => f.ai_classified).length,
        pendingProposals: Number(pendingProposalsRes.count || 0),
        aiAppliedToday: Number(aiAppliedRes.count || 0),
        evidenceCompliance: pct(
          expenseWithProofRes.data?.length || 0,
          expenseData.length,
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card animate-pulse p-4 h-24" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {error ?? "Could not load module stats"}
      </div>
    );
  }

  function fmt(n: number) {
    if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
    return `৳${n.toLocaleString()}`;
  }

  const modules: ModuleStat[] = [
    {
      label: "Projects",
      labelBn: "প্রকল্প",
      value: stats.projects,
      sub: `${stats.activeProjects} active`,
      icon: <Building2 className="h-4 w-4" />,
      color: "text-sky-600",
    },
    {
      label: "Expenses",
      labelBn: "ব্যয়",
      value: fmt(stats.totalExpenseAmount),
      sub: `${stats.pendingExpenses} pending`,
      icon: <Wallet className="h-4 w-4" />,
      color: "text-rose-600",
      alert: stats.pendingExpenses > 5,
    },
    {
      label: "Workers Today",
      labelBn: "আজকের শ্রমিক",
      value: stats.workers,
      sub: `${stats.presentToday} present`,
      icon: <HardHat className="h-4 w-4" />,
      color: "text-amber-600",
    },
    {
      label: "Materials",
      labelBn: "উপকরণ",
      value: stats.materials,
      sub: stats.lowStock > 0 ? `${stats.lowStock} low stock` : "All OK",
      icon: <Package className="h-4 w-4" />,
      color: "text-emerald-600",
      alert: stats.lowStock > 0,
    },
    {
      label: "Files Uploaded",
      labelBn: "ফাইল",
      value: stats.totalFiles,
      sub: `${stats.aiClassified} AI-tagged`,
      icon: <FileText className="h-4 w-4" />,
      color: "text-violet-600",
    },
    {
      label: "Evidence Compliance",
      labelBn: "প্রমাণ সম্মতি",
      value: `${stats.evidenceCompliance}%`,
      sub: "Finance entries with proof",
      icon: <ShieldAlert className="h-4 w-4" />,
      color: stats.evidenceCompliance >= 80 ? "text-emerald-600" : "text-amber-600",
      alert: stats.evidenceCompliance < 60,
    },
    {
      label: "AI Proposals",
      labelBn: "AI প্রস্তাব",
      value: stats.pendingProposals,
      sub: "Pending review",
      icon: <Bot className="h-4 w-4" />,
      color: "text-primary",
      alert: stats.pendingProposals > 0,
    },
    {
      label: "AI Applied Today",
      labelBn: "আজকের AI ইনসার্ট",
      value: stats.aiAppliedToday,
      sub: "Auto-insertions confirmed",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          ERP Module Status
        </h3>
        <button
          type="button"
          onClick={() => void fetchStats()}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {modules.map((m) => (
          <div
            key={m.label}
            className={`relative rounded-2xl border bg-card p-3.5 transition hover:shadow-sm ${
              m.alert
                ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10"
                : "border-border/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted ${m.color}`}>
                {m.icon}
              </div>
              {m.alert && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                  !
                </span>
              )}
            </div>
            <p className="text-lg font-bold leading-none text-foreground">{m.value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{m.label}</p>
            {m.sub && (
              <p className="mt-0.5 text-[10px] text-muted-foreground/70">{m.sub}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
