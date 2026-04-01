import { create } from "zustand";

import { apiRequest } from "@/lib/api";

type NumericValue = number | string;

type Dashboard = {
  total_balance: NumericValue;
  monthly_sales: NumericValue;
  pending_expenses: number;
  recent_expenses: Array<Record<string, unknown>>;
};

function normalizeDashboard(dashboard: Dashboard): Dashboard {
  return {
    ...dashboard,
    total_balance: Number(dashboard.total_balance),
    monthly_sales: Number(dashboard.monthly_sales),
    pending_expenses: Number(dashboard.pending_expenses),
  };
}

type AppState = {
  dashboard: Dashboard | null;
  loading: boolean;
  error: string | null;
  loadDashboard: (token: string) => Promise<void>;
};

export const useAppStore = create<AppState>((set) => ({
  dashboard: null,
  loading: false,
  error: null,
  loadDashboard: async (token) => {
    try {
      set({ loading: true, error: null });
      const dashboard = await apiRequest<Dashboard>("/ai/dashboard", { method: "GET" }, token);
      set({ dashboard: normalizeDashboard(dashboard), loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
