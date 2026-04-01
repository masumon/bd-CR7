"use client";

import { useEffect } from "react";

import { useAppStoreWithPolling } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

export function DashboardPanel() {
  const token = useAuthStore((s) => s.token);
  const dashboard = useAppStoreWithPolling((s) => s.dashboard);
  const loading = useAppStoreWithPolling((s) => s.loading);
  const error = useAppStoreWithPolling((s) => s.error);
  const retryLoad = useAppStoreWithPolling((s) => s.retryLoad);
  const startPolling = useAppStoreWithPolling((s) => s.startPolling);
  const stopPolling = useAppStoreWithPolling((s) => s.stopPolling);
  const retryCount = useAppStoreWithPolling((s) => s.retryCount);

  useEffect(() => {
    if (token) {
      startPolling(token);
      return () => stopPolling();
    }
  }, [token, startPolling, stopPolling]);

  return (
    <section className="module dashboardPanel">
      <div className="panelHeader">
        <h2>Dashboard</h2>
        <span className="roleBadge roleBadgeMuted">Live</span>
      </div>
      {!token ? <p className="panelLead">Login to load live finance and sales metrics.</p> : null}
      {loading ? <p className="panelMessage">Loading...</p> : null}
      {error ? (
        <div className="panelMessage panelError">
          <p>{error}</p>
          <button className="retryButton" onClick={() => token && retryLoad(token)}>
            Retry {retryCount > 0 ? `(Attempt ${retryCount + 1})` : ""}
          </button>
        </div>
      ) : null}
      {dashboard ? (
        <>
          <div className="stats dashboardStats">
            <div className="statCard"><span>Total Balance</span><strong className="statValue statValueBalance">${Number(dashboard.total_balance).toLocaleString()}</strong></div>
            <div className="statCard"><span>Monthly Sales</span><strong className="statValue statValueSales">${Number(dashboard.monthly_sales).toLocaleString()}</strong></div>
            <div className="statCard"><span>Pending Expenses</span><strong className="statValue statValuePending">{dashboard.pending_expenses}</strong></div>
          </div>
          {dashboard.recent_expenses && dashboard.recent_expenses.length > 0 && (
            <div className="recentActivity">
              <h3 className="recentActivityTitle">Recent Activity</h3>
              <div className="recentActivityList">
                {dashboard.recent_expenses.slice(0, 10).map((exp: any, idx: number) => (
                  <div key={exp.id || idx} className="recentActivityItem">
                    {exp.description || 'Expense'}: ${Number(exp.amount).toLocaleString()} ({exp.status})
                  </div>
                ))}
              </div>
              {dashboard.recent_expenses.length > 10 && (
                <p className="recentActivityMeta">
                  Showing 10 of {dashboard.recent_expenses.length} • Load more in Finance panel
                </p>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
