// Pagination store for expenses
import { create } from "zustand";
import { apiRequest } from "@/lib/api";

export type Expense = {
  id: string;
  description: string;
  amount: number | string;
  status: string;
  risk_score?: number;
  risk_level?: string;
  created_at?: string;
};

type ExpensesState = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  pageSize: number;
  loadExpenses: (token: string, pageSize?: number) => Promise<void>;
  loadMoreExpenses: (token: string) => Promise<void>;
  clearExpenses: () => void;
};

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  hasMore: true,
  cursor: null,
  pageSize: 20,
  loadExpenses: async (token, pageSize = 20) => {
    try {
      set({ loading: true, error: null, pageSize });
      // Assuming backend supports ?limit=20&offset=0 or cursor-based pagination
      const expenses = await apiRequest<{ expenses: Expense[]; has_more: boolean; next_cursor?: string }>(
        `/finance/expenses?limit=${pageSize}&offset=0`,
        { method: "GET" },
        token
      );
      set({
        expenses: expenses.expenses || [],
        hasMore: expenses.has_more || false,
        cursor: expenses.next_cursor || null,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  loadMoreExpenses: async (token) => {
    const { pageSize, cursor, expenses } = get();
    try {
      set({ loading: true, error: null });
      const query = cursor
        ? `/finance/expenses?limit=${pageSize}&cursor=${cursor}`
        : `/finance/expenses?limit=${pageSize}&offset=${expenses.length}`;
      const moreExpenses = await apiRequest<{ expenses: Expense[]; has_more: boolean; next_cursor?: string }>(
        query,
        { method: "GET" },
        token
      );
      set({
        expenses: [...expenses, ...(moreExpenses.expenses || [])],
        hasMore: moreExpenses.has_more || false,
        cursor: moreExpenses.next_cursor || null,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  clearExpenses: () => set({ expenses: [], hasMore: true, cursor: null, error: null }),
}));
