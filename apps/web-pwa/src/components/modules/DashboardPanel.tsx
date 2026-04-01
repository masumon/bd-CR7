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
        <>
          <div className="stats dashboardStats">
            <div className="statCard"><span>Total Balance</span><strong style={{color:'#0f6c5a'}}>${Number(dashboard.total_balance).toLocaleString()}</strong></div>
            <div className="statCard"><span>Monthly Sales</span><strong style={{color:'#0a4d41'}}>${Number(dashboard.monthly_sales).toLocaleString()}</strong></div>
            <div className="statCard"><span>Pending Expenses</span><strong style={{color:'#c97f3a'}}>{dashboard.pending_expenses}</strong></div>
          </div>
          {dashboard.recent_expenses && dashboard.recent_expenses.length > 0 && (
            <div style={{marginTop:'16px'}}>
              <h3 style={{fontSize:'13px',color:'var(--muted)',margin:'8px 0'}}>Recent Activity</h3>
              <div style={{fontSize:'12px',maxHeight:'120px',overflowY:'auto'}}>
                {dashboard.recent_expenses.slice(0, 5).map((exp: any) => (
                  <div key={exp.id} style={{padding:'6px',borderLeft:'2px solid var(--accent)',marginBottom:'4px'}}>
                    {exp.description || 'Expense'}: ${Number(exp.amount).toLocaleString()} ({exp.status})
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
