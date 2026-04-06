// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
import { useState } from "react";

import { safeSupabase as supabase } from "@/lib/safeSupabase";

type FundPayload = {
  account_id: string;
  amount: number;
  description?: string;
  [key: string]: unknown;
};

type ExpensePayload = {
  account_id: string;
  amount: number;
  description?: string;
  category_id?: string;
  [key: string]: unknown;
};

type UseFinanceReturn = {
  loading: boolean;
  message: string;
  submitFund: (payload: FundPayload) => Promise<boolean>;
  submitExpense: (payload: ExpensePayload) => Promise<boolean>;
};

export function useFinance(): UseFinanceReturn {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submitFund = async (payload: FundPayload): Promise<boolean> => {
    try {
      setLoading(true);
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("fund_transfers").insert(payload);
      if (error) throw error;

      // OLD (DISABLED - SAFE)
      // await apiClient<{ id?: string }>("/api/others/fund_transfers", {
      //   method: "POST",
      //   body: JSON.stringify(payload),
      // });
      // console.log("API WRITE USED - SAFE MODE");
      setMessage("Fund saved");
      return true;
    } catch (err) {
      setMessage((err as Error).message || "Fund save failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async (payload: ExpensePayload): Promise<boolean> => {
    try {
      setLoading(true);
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;

      // OLD (DISABLED - SAFE)
      // await apiClient<{ id?: string }>("/api/others/expenses", {
      //   method: "POST",
      //   body: JSON.stringify(payload),
      // });
      // console.log("API WRITE USED - SAFE MODE");
      setMessage("Expense saved");
      return true;
    } catch (err) {
      setMessage((err as Error).message || "Expense save failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, message, submitFund, submitExpense };
}
