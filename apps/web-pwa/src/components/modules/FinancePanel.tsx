"use client";

import { FundManagerFeature } from "@/features/finance_core/fund_manager/FundManagerFeature";
import { ExpenseEngineFeature } from "@/features/finance_core/expense_engine/ExpenseEngineFeature";

export function FinancePanel() {
  return (
    <section className="module">
      <h2>Finance Core</h2>
      <FundManagerFeature />
      <ExpenseEngineFeature />
    </section>
  );
}
