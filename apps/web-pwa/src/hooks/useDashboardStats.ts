"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DashboardStats {
  totalFundsReceived: number;
  currentBalance: number;
  totalExpenses: number;
  pendingExpenses: number;
  totalWorkers: number;
  totalProjects: number;
  totalExpenseEntries: number;
  pendingApprovals: number;
  recentActivity: string[];
  monthlySeries: { name: string; fund: number; expense: number }[];
  loading: boolean;
}

const DEFAULT: DashboardStats = {
  totalFundsReceived: 0,
  currentBalance: 0,
  totalExpenses: 0,
  pendingExpenses: 0,
  totalWorkers: 0,
  totalProjects: 0,
  totalExpenseEntries: 0,
  pendingApprovals: 0,
  recentActivity: [],
  monthlySeries: [],
  loading: true,
};

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT);

  useEffect(() => {
    if (!supabase) {
      setStats({ ...DEFAULT, loading: false });
      return;
    }
    void fetchAll();
  }, []);

  async function fetchAll() {
    if (!supabase) return;
    try {
      const [
        { data: accounts },
        { data: txns },
        { data: allExp },
        { count: workerCount },
        { count: projectCount },
        { count: approvalCount },
        { data: auditRows },
      ] = await Promise.all([
        supabase.from("fund_accounts").select("balance"),
        supabase.from("fund_transactions").select("amount, direction, created_at"),
        supabase.from("expenses").select("amount, status, created_at"),
        supabase.from("workers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase
          .from("audit_logs")
          .select("action, entity_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const currentBalance = (accounts ?? []).reduce((s, r) => s + Number(r.balance), 0);

      const txnList = txns ?? [];
      const totalFundsReceived = txnList
        .filter((t) => !t.direction || t.direction === "credit")
        .reduce((s, r) => s + Number(r.amount), 0);

      const expList = allExp ?? [];
      const totalExpenses = expList
        .filter((e) => e.status === "approved")
        .reduce((s, r) => s + Number(r.amount), 0);

      const pendingExpenses = expList.filter((e) => e.status === "pending").length;

      // Last 6 months series
      const now = new Date();
      const monthlySeries = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const inMonth = (list: { created_at: string; amount: number }[]) =>
          list.filter((r) => {
            const rd = new Date(r.created_at);
            return rd.getFullYear() === y && rd.getMonth() === m;
          });
        const fund = inMonth(txnList).reduce((s, r) => s + Number(r.amount), 0);
        const expense = inMonth(expList).reduce((s, r) => s + Number(r.amount), 0);
        return { name: MONTHS[m], fund, expense };
      });

      const recentActivity = (auditRows ?? []).map(
        (r) =>
          `${r.action} · ${r.entity_type} · ${new Date(r.created_at).toLocaleTimeString("en-BD", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
      );

      setStats({
        totalFundsReceived,
        currentBalance,
        totalExpenses,
        pendingExpenses,
        totalWorkers: workerCount ?? 0,
        totalProjects: projectCount ?? 0,
        totalExpenseEntries: expList.length,
        pendingApprovals: approvalCount ?? 0,
        recentActivity: recentActivity.length ? recentActivity : ["No recent activity recorded"],
        monthlySeries,
        loading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }

  return stats;
}
