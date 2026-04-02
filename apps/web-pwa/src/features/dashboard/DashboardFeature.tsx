"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useAppStoreWithPolling } from "@/store/appStore";
import { FloatingSumonixButton } from "@/features/sumonix_ai_ui/FloatingSumonixButton";

export function DashboardFeature() {
  const token = useAuthStore((s) => s.token);
  const dashboard = useAppStoreWithPolling((s) => s.dashboard);
  const loading = useAppStoreWithPolling((s) => s.loading);
  const error = useAppStoreWithPolling((s) => s.error);
  const startPolling = useAppStoreWithPolling((s) => s.startPolling);
  const stopPolling = useAppStoreWithPolling((s) => s.stopPolling);

  useEffect(() => {
    if (!token) return;
    startPolling(token);
    return () => stopPolling();
  }, [token, startPolling, stopPolling]);

  const recent = dashboard?.recent_expenses || [];
  const totalExpense = recent.reduce((sum, item) => sum + Number((item as { amount?: number | string }).amount || 0), 0);
  const currentBalance = Number(dashboard?.total_balance || 0);
  const totalFund = currentBalance + totalExpense;
  const completion = totalFund > 0 ? Math.min(100, Math.max(0, Math.round((currentBalance / totalFund) * 100))) : 0;

  return (
    <section className="module dashboardPanel">
      <div className="panelHeader">
        <h2>Dashboard</h2>
        <span className="roleBadge roleBadgeMuted">Live</span>
      </div>

      {!token ? <p className="panelLead">Login to load live metrics.</p> : null}
      {loading ? <p className="panelMessage">Loading...</p> : null}
      {error ? <p className="panelMessage panelError">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Total Fund</p>
          <p className="text-lg font-bold text-slate-900">${totalFund.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Total Expense</p>
          <p className="text-lg font-bold text-slate-900">${totalExpense.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Current Balance</p>
          <p className="text-lg font-bold text-emerald-700">${currentBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Project Completion %</p>
          <p className="text-lg font-bold text-slate-900">{completion}%</p>
        </div>
      </div>

      <div className="dashboardProgressWrap">
        <div className="dashboardProgressMeta">
          <span>Progress</span>
          <span>{completion}%</span>
        </div>
        <progress className="dashboardProgress" max={100} value={completion} aria-label="Project completion" />
      </div>

      <div className="recentActivity mt-4">
        <h3 className="recentActivityTitle">Recent Activity Timeline</h3>
        <div className="recentActivityList">
          {recent.slice(0, 10).map((exp, idx) => (
            <div key={String((exp as { id?: string }).id || idx)} className="recentActivityItem">
              {String((exp as { description?: string }).description || "Expense")} - ${Number((exp as { amount?: number | string }).amount || 0).toLocaleString()} ({String((exp as { status?: string }).status || "pending")})
            </div>
          ))}
          {recent.length === 0 ? <p className="text-xs text-slate-500">No recent activity.</p> : null}
        </div>
      </div>

      <FloatingSumonixButton />
    </section>
  );
}
