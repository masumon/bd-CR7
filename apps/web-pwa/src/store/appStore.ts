import { create } from "zustand";

import { supabase } from "@/lib/supabase";

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
  loadDashboard: async () => {
    try {
      set({ loading: true, error: null });
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [{ data: accounts }, { data: sales }, { count: pendingCount }, { data: recent }] = await Promise.all([
        supabase.from("fund_accounts").select("balance"),
        supabase.from("sales").select("total_amount,created_at").gte("created_at", monthStart.toISOString()),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("expenses").select("id,description,amount,status,created_at").order("created_at", { ascending: false }).limit(20),
      ]);

      const totalBalance = (accounts || []).reduce((sum, a: { balance?: number | string }) => sum + Number(a.balance || 0), 0);
      const monthlySales = (sales || []).reduce((sum, s: { total_amount?: number | string }) => sum + Number(s.total_amount || 0), 0);
      const dashboard: Dashboard = {
        total_balance: totalBalance,
        monthly_sales: monthlySales,
        pending_expenses: Number(pendingCount || 0),
        recent_expenses: (recent || []) as Array<Record<string, unknown>>,
      };
      set({ dashboard: normalizeDashboard(dashboard), loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

type AppStateWithPolling = AppState & {
  pollInterval: NodeJS.Timeout | null;
  retryCount: number;
  startPolling: (token: string) => void;
  stopPolling: () => void;
  retryLoad: (token: string) => Promise<void>;
};

export const useAppStoreWithPolling = create<AppStateWithPolling>((set, get) => ({
  dashboard: null,
  loading: false,
  error: null,
  pollInterval: null,
  retryCount: 0,
  loadDashboard: async () => {
    try {
      set({ loading: true, error: null, retryCount: 0 });
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [{ data: accounts }, { data: sales }, { count: pendingCount }, { data: recent }] = await Promise.all([
        supabase.from("fund_accounts").select("balance"),
        supabase.from("sales").select("total_amount,created_at").gte("created_at", monthStart.toISOString()),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("expenses").select("id,description,amount,status,created_at").order("created_at", { ascending: false }).limit(20),
      ]);

      const totalBalance = (accounts || []).reduce((sum, a: { balance?: number | string }) => sum + Number(a.balance || 0), 0);
      const monthlySales = (sales || []).reduce((sum, s: { total_amount?: number | string }) => sum + Number(s.total_amount || 0), 0);
      const dashboard: Dashboard = {
        total_balance: totalBalance,
        monthly_sales: monthlySales,
        pending_expenses: Number(pendingCount || 0),
        recent_expenses: (recent || []) as Array<Record<string, unknown>>,
      };
      set({ dashboard: normalizeDashboard(dashboard), loading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  retryLoad: async (token) => {
    const { retryCount } = get();
    const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // exponential backoff, max 10s
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    try {
      set({ loading: true });
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [{ data: accounts }, { data: sales }, { count: pendingCount }, { data: recent }] = await Promise.all([
        supabase.from("fund_accounts").select("balance"),
        supabase.from("sales").select("total_amount,created_at").gte("created_at", monthStart.toISOString()),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("expenses").select("id,description,amount,status,created_at").order("created_at", { ascending: false }).limit(20),
      ]);

      const totalBalance = (accounts || []).reduce((sum, a: { balance?: number | string }) => sum + Number(a.balance || 0), 0);
      const monthlySales = (sales || []).reduce((sum, s: { total_amount?: number | string }) => sum + Number(s.total_amount || 0), 0);
      const dashboard: Dashboard = {
        total_balance: totalBalance,
        monthly_sales: monthlySales,
        pending_expenses: Number(pendingCount || 0),
        recent_expenses: (recent || []) as Array<Record<string, unknown>>,
      };
      set({ dashboard: normalizeDashboard(dashboard), loading: false, error: null, retryCount: 0 });
    } catch (error) {
      set({ error: (error as Error).message, loading: false, retryCount: retryCount + 1 });
    }
  },
  startPolling: (token) => {
    const state = get();
    if (state.pollInterval) return; // already polling
    state.loadDashboard(token);
    const interval = setInterval(() => {
      state.loadDashboard(token);
    }, 30000); // poll every 30 seconds
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
