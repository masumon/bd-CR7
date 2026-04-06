export interface ExpenseRow {
  id: string;
  amount: number;
  status: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  receipt_url?: string | null;
}

export type ExpenseEditForm = {
  amount: number;
  status: string;
  description: string;
  category: string;
  subcategory: string;
};
