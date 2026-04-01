"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store/appStore";
import { useAppStoreWithPolling } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

export function DashboardPanel() {
  const token = useAuthStore((s) => s.token);
  const dashboard = useAppStoreWithPolling((s) => s.dashboard);
  const loading = useAppStoreWithPolling((s) => s.loading);
  const error = useAppStoreWithPolling((s) => s.error);
  const loadDashboard = useAppStoreWithPolling((s) => s.loadDashboard);
  const retryLoad = useAppStoreWithPolling((s) => s.retryLoad);
  const startPolling = useAppStoreWithPolling((s) => s.startPolling);
  const stopPolling = useAppStoreWithPolling((s) => s.stopPolling);
  const retryCount = useAppStoreWithPolling((s) => s.retryCount);

  useEffect(() => {
    if (token) {
      startPolling(token);
      return () => stopPolling();
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
      {error ? (
        <div className="panelMessage panelError">
          <p>{error}</p>
          <button
            onClick={() => token && retryLoad(token)}
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              backgroundColor: "#c97f3a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Retry {retryCount > 0 ? `(Attempt ${retryCount + 1})` : ""}
          </button>
        </div>
      ) : null}
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
                {dashboard.recent_expenses.slice(0, 10).map((exp: any, idx: number) => (
                  <div key={exp.id || idx} style={{padding:'6px',borderLeft:'2px solid var(--accent)',marginBottom:'4px'}}>
                    {exp.description || 'Expense'}: ${Number(exp.amount).toLocaleString()} ({exp.status})
                  </div>
                ))}
              </div>
              {dashboard.recent_expenses.length > 10 && (
                <p style={{fontSize:'11px',color:'var(--muted)',margin:'6px 0'}}>
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
