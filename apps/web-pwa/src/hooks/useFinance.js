import { useState } from "react";

import { supabase } from "@/lib/supabase";

export function useFinance() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submitFund = async (payload) => {
    try {
      setLoading(true);
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("fund_transactions").insert(payload);
      if (error) throw error;
      setMessage("Fund saved");
      return true;
    } catch (error) {
      setMessage(error.message || "Fund save failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async (payload) => {
    try {
      setLoading(true);
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;
      setMessage("Expense saved");
      return true;
    } catch (error) {
      setMessage(error.message || "Expense save failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, message, submitFund, submitExpense };
}
