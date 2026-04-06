import { apiClient } from "@/lib/apiClient";
import type { ExpenseEditForm, ExpenseRow } from "@/features/finance_core/types";

type ExpensesListResponse = {
  expenses: ExpenseRow[];
};

export async function fetchExpenses(token?: string): Promise<ExpenseRow[]> {
  const data = await apiClient<ExpensesListResponse>("/api/finance/expenses?limit=60&offset=0", { method: "GET" }, token);
  return data.expenses || [];
}

export async function updateExpense(id: string, form: ExpenseEditForm, token?: string): Promise<string | null> {
  try {
    await apiClient<{ message: string }>(
      `/api/finance/expenses/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          amount: form.amount,
          status: form.status,
          description: form.description,
          category: form.category,
          subcategory: form.subcategory,
        }),
      },
      token,
    );
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

export async function deleteExpense(id: string, token?: string): Promise<string | null> {
  try {
    await apiClient<{ message: string }>(`/api/finance/expenses/${id}`, { method: "DELETE" }, token);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}
