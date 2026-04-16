"use client";

import { useEffect, useMemo, useState } from "react";

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

const DASHBOARD_CACHE_TTL_MS = 60_000;
const DASHBOARD_STORAGE_PREFIX = "bdcr7-dashboard-stats:";

type CachedDashboardStats = DashboardStats & {
  cachedAt: number;
};

type DashboardStatsMode = "light" | "detailed";

const dashboardMemoryCache = new Map<string, CachedDashboardStats>();
const dashboardRequestCache = new Map<string, Promise<DashboardStats>>();

function getCacheKey(token: string, mode: DashboardStatsMode): string {
  return `${DASHBOARD_STORAGE_PREFIX}${mode}:${token.slice(0, 16)}`;
}

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < DASHBOARD_CACHE_TTL_MS;
}

function readSessionCache(token: string, mode: DashboardStatsMode): CachedDashboardStats | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(getCacheKey(token, mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDashboardStats;
    if (typeof parsed?.cachedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(token: string, mode: DashboardStatsMode, stats: DashboardStats): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      getCacheKey(token, mode),
      JSON.stringify({ ...stats, cachedAt: Date.now() } satisfies CachedDashboardStats)
    );
  } catch {
    // Best effort only.
  }
}

async function fetchDashboardStats(authToken: string, mode: DashboardStatsMode): Promise<DashboardStats> {
  const requestKey = `${mode}:${authToken}`;
  const inFlight = dashboardRequestCache.get(requestKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const dashboard = await apiClient<DashboardApi>("/api/finance/dashboard", { method: "GET" }, authToken);
    const recentActivity = (dashboard.recent_expenses || []).slice(0, 5).map((item) => {
      const created = item.created_at ? new Date(item.created_at) : new Date();
      return `${item.description || "Expense"} · ${Number(item.amount || 0).toLocaleString("en-BD")} · ${created.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}`;
    });

    const totalFundsReceived = Number(dashboard.monthly_sales || 0);

    if (mode === "light") {
      const nextStats: DashboardStats = {
        totalFundsReceived,
        currentBalance: Number(dashboard.fund_balance || dashboard.total_balance || 0),
        totalExpenses: Number(dashboard.total_expenses || 0),
        pendingExpenses: Number(dashboard.pending_expenses || 0),
        totalWorkers: Number(dashboard.total_workers || 0),
        totalProjects: Number(dashboard.total_projects || 0),
        totalExpenseEntries: Array.isArray(dashboard.recent_expenses) ? dashboard.recent_expenses.length : 0,
        pendingApprovals: 0,
        recentActivity: recentActivity.length ? recentActivity : ["No recent activity recorded"],
        monthlySeries: [],
        expenseBreakdown: [],
        loading: false,
        error: null,
      };

      dashboardMemoryCache.set(requestKey, { ...nextStats, cachedAt: Date.now() });
      writeSessionCache(authToken, mode, nextStats);
      return nextStats;
    }

    const expensesResp = await apiClient<ExpensesResponse>("/api/finance/expenses?limit=200&offset=0", { method: "GET" }, authToken);
    const expenses = expensesResp.expenses || [];
    const totalExpenses = expenses
      .filter((e) => String(e.status || "").toLowerCase() === "approved")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const now = new Date();
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

    const totalMonthlyExpense = monthlyExpenses.reduce((s, m) => s + m.expense, 0);
    const monthlySeries = monthlyExpenses.map((m) => {
      const fund =
        totalMonthlyExpense > 0
          ? Math.round((m.expense / totalMonthlyExpense) * totalFundsReceived)
          : Math.round(totalFundsReceived / Math.max(1, monthlyExpenses.length));
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

    const nextStats: DashboardStats = {
      totalFundsReceived,
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
    };

    dashboardMemoryCache.set(requestKey, { ...nextStats, cachedAt: Date.now() });
    writeSessionCache(authToken, mode, nextStats);
    return nextStats;
  })();

  dashboardRequestCache.set(requestKey, request);

  try {
    return await request;
  } finally {
    dashboardRequestCache.delete(requestKey);
  }
}

export function useDashboardStats(options: { includeDetails?: boolean } = {}): DashboardStats {
  const token = useAuthStore((state) => state.token ?? undefined);
  const mode: DashboardStatsMode = options.includeDetails === false ? "light" : "detailed";
  const [stats, setStats] = useState<DashboardStats>(DEFAULT);
  const cachedSnapshot = useMemo(() => {
    if (!token) return null;
    return dashboardMemoryCache.get(`${mode}:${token}`) ?? readSessionCache(token, mode);
  }, [mode, token]);

  useEffect(() => {
    if (!token) {
      setStats({ ...DEFAULT, loading: false, error: null });
      return;
    }
    let cancelled = false;

    if (cachedSnapshot) {
      dashboardMemoryCache.set(`${mode}:${token}`, cachedSnapshot);
      setStats({ ...cachedSnapshot, loading: false, error: null });
      if (isFresh(cachedSnapshot.cachedAt)) {
        return;
      }
    } else {
      setStats((prev) => ({ ...prev, loading: true, error: null }));
    }

    void fetchDashboardStats(token, mode)
      .then((nextStats) => {
        if (!cancelled) {
          setStats(nextStats);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        if (!cancelled) {
          setStats((prev) => ({
            ...(cachedSnapshot ? { ...cachedSnapshot, loading: false } : prev),
            loading: false,
            error: message,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, token, cachedSnapshot]);

  return stats;
}
