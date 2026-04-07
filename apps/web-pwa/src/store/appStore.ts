import { create } from "zustand";

import { apiClient } from "@/lib/apiClient";

type NumericValue = number | string;

type Dashboard = {
  total_balance: NumericValue;
  monthly_sales: NumericValue;
  pending_expenses: number;
  recent_expenses: Array<Record<string, unknown>>;
};

type DashboardPayload = {
  total_balance?: NumericValue;
  monthly_sales?: NumericValue;
  pending_expenses?: number;
  recent_expenses?: Array<Record<string, unknown>>;
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
  loadDashboard: (token?: string) => Promise<void>;
};

async function fetchDashboard(token?: string): Promise<Dashboard> {
  const payload = await apiClient<DashboardPayload>("/api/finance/dashboard", { method: "GET" }, token);
  return normalizeDashboard({
    total_balance: payload.total_balance || 0,
    monthly_sales: payload.monthly_sales || 0,
    pending_expenses: Number(payload.pending_expenses || 0),
    recent_expenses: payload.recent_expenses || [],
  });
}

export const useAppStore = create<AppState>((set) => ({
  dashboard: null,
  loading: false,
  error: null,
  loadDashboard: async (token) => {
    try {
      set({ loading: true, error: null });
      set({ dashboard: await fetchDashboard(token), loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

type AppStateWithPolling = AppState & {
  pollInterval: NodeJS.Timeout | null;
  retryCount: number;
  startPolling: (token?: string) => void;
  stopPolling: () => void;
  retryLoad: (token?: string) => Promise<void>;
};

export const useAppStoreWithPolling = create<AppStateWithPolling>((set, get) => ({
  dashboard: null,
  loading: false,
  error: null,
  pollInterval: null,
  retryCount: 0,
  loadDashboard: async (token) => {
    try {
      set({ loading: true, error: null, retryCount: 0 });
      set({ dashboard: await fetchDashboard(token), loading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  retryLoad: async (token) => {
    const { retryCount } = get();
    const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    try {
      set({ loading: true });
      set({ dashboard: await fetchDashboard(token), loading: false, error: null, retryCount: 0 });
    } catch (error) {
      set({ error: (error as Error).message, loading: false, retryCount: retryCount + 1 });
    }
  },
  startPolling: (token) => {
    const state = get();
    if (state.pollInterval) return;
    void state.loadDashboard(token);
    const interval = setInterval(() => {
      void state.loadDashboard(token);
    }, 30000);
    set({ pollInterval: interval });
  },
  stopPolling: () => {
    const state = get();
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
      set({ pollInterval: null });
    }
  },
}));
