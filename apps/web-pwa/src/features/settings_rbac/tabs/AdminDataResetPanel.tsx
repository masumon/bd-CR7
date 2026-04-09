"use client";

import { useState } from "react";
import { AlertTriangle, Download, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

type ResetScope = "test_data" | "all_expenses" | "all_worker_logs";

const SCOPE_LABELS: Record<ResetScope, { label: string; desc: string; danger: boolean }> = {
  test_data: {
    label: "Test / Demo Data",
    desc: "Soft-deletes expense rows whose description contains [TEST] or [DEMO]. Safe for most environments.",
    danger: false,
  },
  all_expenses: {
    label: "All Expenses",
    desc: "Marks ALL expense records as deleted. Use only on staging/demo instances. Cannot be done in production without explicit confirmation.",
    danger: true,
  },
  all_worker_logs: {
    label: "All Worker Logs",
    desc: "Marks ALL worker attendance logs as deleted. Irreversible without DB-level restore.",
    danger: true,
  },
};

type ResetResult = {
  status: string;
  scope: string;
  total_soft_deleted: number;
  deleted_counts: Record<string, number>;
  snapshot_row_count: Record<string, number>;
  snapshot: Record<string, unknown[]>;
  timestamp: string;
};

export function AdminDataResetPanel() {
  const token = useAuthStore((s) => s.token ?? undefined);
  const role = useAuthStore((s) => s.role);

  const [scope, setScope] = useState<ResetScope>("test_data");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [error, setError] = useState("");

  // Only super_admin can use this panel
  if (role !== "super_admin") {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <p className="text-sm">This panel is restricted to super_admin accounts.</p>
        </div>
      </div>
    );
  }

  const handleReset = async () => {
    if (!confirmed) {
      setError("You must check the confirmation checkbox to proceed.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    const data = await apiClient<ResetResult>(
      "/api/admin/soft-reset",
      {
        method: "POST",
        body: JSON.stringify({ scope, confirm: true, reason: reason.trim() }),
      },
      token,
    );

    setLoading(false);

    if (!data) {
      setError("Soft-reset request failed. Check the console or API logs.");
      return;
    }
    setResult(data);
    setConfirmed(false);
    setReason("");
  };

  const downloadSnapshot = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soft-reset-snapshot-${result.timestamp.slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scopeInfo = SCOPE_LABELS[scope];

  return (
    <div className="space-y-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
        <div>
          <p className="text-sm font-semibold text-foreground">Soft Data Reset (Admin Only)</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Records are marked as <code className="rounded bg-muted px-1 py-0.5 text-[11px]">is_deleted=true</code> — no data is permanently removed.
            A JSON snapshot is exported before any change so records can be restored.
          </p>
        </div>
      </div>

      {/* Scope selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reset Scope</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(SCOPE_LABELS) as ResetScope[]).map((s) => {
            const info = SCOPE_LABELS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setScope(s); setConfirmed(false); }}
                className={`rounded-xl border p-3 text-left transition ${
                  scope === s
                    ? info.danger
                      ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                      : "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:border-border"
                }`}
              >
                <p className="text-xs font-semibold">{info.label}</p>
                <p className="mt-0.5 text-[10px] opacity-80">{info.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason input */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reason (optional)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Clearing demo data before client handover"
          maxLength={255}
          className="w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Confirmation checkbox */}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-rose-500"
        />
        <span className="text-xs text-muted-foreground">
          I understand this will soft-delete <strong className="text-foreground">{scopeInfo.label}</strong> records.
          {scopeInfo.danger && (
            <span className="ml-1 font-semibold text-rose-400"> This is a destructive scope — use with caution.</span>
          )}
        </span>
      </label>

      {error && (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
      )}

      {/* Action button */}
      <Button
        variant="outline"
        className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
        disabled={loading || !confirmed}
        onClick={() => void handleReset()}
      >
        {loading ? "Processing…" : "Execute Soft Reset"}
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-400">
              Reset complete — {result.total_soft_deleted} records soft-deleted
            </p>
            <Button
              variant="outline"
              className="h-8 gap-1.5 border-emerald-500/40 px-3 text-xs text-emerald-400 hover:bg-emerald-500/10"
              onClick={downloadSnapshot}
            >
              <Download className="h-3.5 w-3.5" />
              Download Snapshot
            </Button>
          </div>
          <ul className="space-y-1">
            {Object.entries(result.deleted_counts).map(([tbl, cnt]) => (
              <li key={tbl} className="text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1 text-[11px]">{tbl}</code>: {cnt} rows soft-deleted
                {result.snapshot_row_count[tbl] != null && (
                  <span className="ml-1 opacity-70">(snapshot: {result.snapshot_row_count[tbl]} rows saved)</span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground/60">
            Timestamp: {result.timestamp} · Download the snapshot JSON above to restore records manually if needed.
          </p>
        </div>
      )}
    </div>
  );
}
