"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type DashboardApi = {
  total_balance?: number;
  fund_balance?: number;
  monthly_sales?: number;
  total_expenses?: number;
  pending_expenses?: number;
  total_workers?: number;
  total_projects?: number;
  recent_expenses?: Array<{ id?: string; description?: string; amount?: number | string; status?: string; created_at?: string }>;
};

type ExpensesResponse = {
  expenses?: Array<{ amount?: number | string; status?: string; created_at?: string; metadata?: { category?: string } }>;
};

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
  expenseBreakdown: { name: string; value: number }[];
  loading: boolean;
  error: string | null;
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
  expenseBreakdown: [],
  loading: true,
  error: null,
};

export function useDashboardStats(): DashboardStats {
  const token = useAuthStore((state) => state.token ?? undefined);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT);

  useEffect(() => {
    if (!token) {
      setStats({ ...DEFAULT, loading: false, error: null });
      return;
    }
    void fetchAll(token);
  }, [token]);

  async function fetchAll(authToken: string) {
    try {
      const [dashboard, expensesResp] = await Promise.all([
        apiClient<DashboardApi>("/api/finance/dashboard", { method: "GET" }, authToken),
        apiClient<ExpensesResponse>("/api/finance/expenses?limit=200&offset=0", { method: "GET" }, authToken),
      ]);

      const expenses = expensesResp.expenses || [];
      const totalExpenses = expenses
        .filter((e) => String(e.status || "").toLowerCase() === "approved")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const recentActivity = (dashboard.recent_expenses || []).slice(0, 5).map((item) => {
        const created = item.created_at ? new Date(item.created_at) : new Date();
        return `${item.description || "Expense"} · ${Number(item.amount || 0).toLocaleString("en-BD")} · ${created.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}`;
      });

      const now = new Date();
      // Compute per-month expense totals for the last 6 months
      const monthlyExpenses = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const expense = expenses
          .filter((row) => {
            if (!row.created_at) return false;
            const rd = new Date(row.created_at);
            return rd.getFullYear() === y && rd.getMonth() === m;
          })
          .reduce((sum, row) => sum + Number(row.amount || 0), 0);
        return { name: MONTHS[m], expense };
      });
      // Distribute total funds received proportionally across months with expense data
      // so the Progress line chart (cumExpense/cumFund) shows a meaningful ratio.
      const totalMonthlyExpense = monthlyExpenses.reduce((s, m) => s + m.expense, 0);
      const totalFundsReceived = Number(dashboard.monthly_sales || 0);
      const monthlySeries = monthlyExpenses.map((m) => {
        // Allocate fund for this month proportional to its share of total expense;
        // fall back to even distribution when there are no expenses yet.
        const fund =
          totalMonthlyExpense > 0
            ? Math.round((m.expense / totalMonthlyExpense) * totalFundsReceived)
            : Math.round(totalFundsReceived / monthlyExpenses.length);
        return { name: m.name, fund, expense: m.expense };
      });

      const categoryTotals: Record<string, number> = {};
      for (const row of expenses) {
        const category = row.metadata?.category || "Other";
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(row.amount || 0);
      }
      const expenseBreakdown = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([name, value]) => ({ name, value }));

      setStats({
        totalFundsReceived: Number(dashboard.monthly_sales || 0),
        currentBalance: Number(dashboard.fund_balance || dashboard.total_balance || 0),
        totalExpenses: Number(dashboard.total_expenses || totalExpenses),
        pendingExpenses: Number(dashboard.pending_expenses || 0),
        totalWorkers: Number(dashboard.total_workers || 0),
        totalProjects: Number(dashboard.total_projects || 0),
        totalExpenseEntries: expenses.length,
        pendingApprovals: 0,
        recentActivity: recentActivity.length ? recentActivity : ["No recent activity recorded"],
        monthlySeries,
        expenseBreakdown,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setStats((prev) => ({ ...prev, loading: false, error: message }));
    }
  }

  return stats;
}
