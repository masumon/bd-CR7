"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

export function DashboardPanel() {
  const token = useAuthStore((s) => s.token);
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const loadDashboard = useAppStore((s) => s.loadDashboard);

  useEffect(() => {
    if (token) {
      void loadDashboard(token);
    }
  }, [token, loadDashboard]);

  return (
    <section className="module dashboardPanel">
      <div className="panelHeader">
        <h2>Dashboard</h2>
        <span className="roleBadge roleBadgeMuted">Live</span>
      </div>
      {!token ? <p className="panelLead">Login to load live finance and sales metrics.</p> : null}
      {loading ? <p className="panelMessage">Loading...</p> : null}
      {error ? <p className="panelMessage panelError">{error}</p> : null}
      {dashboard ? (
        <div className="stats dashboardStats">
          <div className="statCard"><span>Total Balance</span><strong>{Number(dashboard.total_balance).toLocaleString()}</strong></div>
          <div className="statCard"><span>Monthly Sales</span><strong>{Number(dashboard.monthly_sales).toLocaleString()}</strong></div>
          <div className="statCard"><span>Pending Expenses</span><strong>{dashboard.pending_expenses}</strong></div>
        </div>
      ) : null}
    </section>
  );
}
