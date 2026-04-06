// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

/**
 * AIAutoInsertPanel
 * ─────────────────────────────────────────────
 * After a file is uploaded and classified, this panel fetches the AI's
 * auto-insertion proposal for that file and lets the user:
 *   1. See the pre-filled fields the AI extracted
 *   2. Edit any field inline
 *   3. Click "Confirm & Apply" → POST /api/ai-employ/confirm
 *   4. Click "Reject" → POST /api/ai-employ/reject
 *
 * Props:
 *   fileId        — the uploaded file's project_files.id
 *   onConfirmed   — called after the row is successfully inserted
 *   onRejected    — called after the user rejects
 */

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Proposal {
  proposal_id: string;
  module: string;
  target_table: string;
  proposed_data: Record<string, unknown>;
  confidence: number;
  message: string;
}

interface AIAutoInsertPanelProps {
  fileId: string;
  onConfirmed?: (targetTable: string) => void;
  onRejected?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount (৳)",
  description: "Description",
  material_name: "Material Name",
  movement_type: "Movement Type",
  quantity: "Quantity",
  unit: "Unit",
  unit_price: "Unit Price (৳)",
  supplier: "Supplier",
  worker_name: "Worker Name",
  role: "Role",
  status: "Attendance Status",
  daily_wage: "Daily Wage (৳)",
  paid_amount: "Paid Amount (৳)",
  phase: "Phase",
  caption: "Caption",
  date: "Date",
  notes: "Notes",
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isEditable(key: string): boolean {
  // Skip internal/auto fields from user editing
  return !["maker_id", "metadata", "file_url", "file_type", "project_id"].includes(key);
}

export function AIAutoInsertPanel({ fileId, onConfirmed, onRejected }: AIAutoInsertPanelProps) {
  const token = useAuthStore((s) => s.token);

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [expanded, setExpanded] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [status, setStatus] = useState<"idle" | "confirmed" | "rejected">("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchProposal = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<Proposal | { proposal_id: null; message: string }>(
        "/api/ai-employ/propose",
        { method: "POST", body: JSON.stringify({ file_id: fileId }) },
        token,
      );
      if ("proposal_id" in res && res.proposal_id) {
        setProposal(res as Proposal);
        setEdits({}); // reset edits on fresh fetch
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch AI proposal");
    } finally {
      setLoading(false);
    }
  }, [fileId, token]);

  useEffect(() => {
    void fetchProposal();
  }, [fetchProposal]);

  const handleConfirm = async () => {
    if (!proposal || !token) return;
    setConfirming(true);
    setError(null);
    try {
      await apiRequest(
        "/api/ai-employ/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            proposal_id: proposal.proposal_id,
            edited_data: edits,
          }),
        },
        token,
      );
      setStatus("confirmed");
      onConfirmed?.(proposal.target_table);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!proposal || !token) return;
    setRejecting(true);
    try {
      await apiRequest(
        "/api/ai-employ/reject",
        {
          method: "POST",
          body: JSON.stringify({ proposal_id: proposal.proposal_id, note: "User rejected" }),
        },
        token,
      );
      setStatus("rejected");
      onRejected?.();
    } catch {
      // silently dismiss
      setStatus("rejected");
    } finally {
      setRejecting(false);
    }
  };

  // ── Render states ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        SUMONIX AI is analyzing your file…
      </div>
    );
  }

  if (!proposal) return null;

  if (status === "confirmed") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        AI data applied to <strong className="ml-0.5">{proposal.target_table}</strong>. Review in the list below.
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        AI suggestion dismissed.
      </div>
    );
  }

  const displayData = { ...proposal.proposed_data, ...edits };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary">SUMONIX AI Auto-Fill</p>
            <p className="text-[10px] text-muted-foreground">
              Detected: <span className="capitalize font-medium">{proposal.module}</span>
              {" · "}Confidence: {Math.round(proposal.confidence * 100)}%
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-primary/15 px-4 pb-4 pt-3 space-y-3">
          <p className="text-[11px] text-muted-foreground">{proposal.message}</p>

          {/* Editable field grid */}
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(displayData)
              .filter(([k]) => isEditable(k) && k !== "metadata")
              .map(([key, val]) => (
                <div key={key} className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {fieldLabel(key)}
                  </label>
                  <input
                    type={typeof val === "number" ? "number" : "text"}
                    value={
                      edits[key] !== undefined
                        ? String(edits[key])
                        : val === null || val === undefined
                        ? ""
                        : String(val)
                    }
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [key]: typeof val === "number" ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/50 transition"
                  />
                </div>
              ))}
          </div>

          {error && <p className="text-[11px] text-rose-500">{error}</p>}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={confirming || rejecting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {confirming ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Applying…</>
              ) : (
                <><CheckCircle2 className="h-3 w-3" /> Confirm & Apply</>
              )}
            </button>

            <button
              type="button"
              onClick={() => void fetchProposal()}
              disabled={confirming || rejecting || loading}
              title="Re-analyse"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={confirming || rejecting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition disabled:opacity-60"
            >
              {rejecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <><XCircle className="h-3 w-3" /> Reject</>
              )}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            <Pencil className="inline h-2.5 w-2.5 mr-0.5" />
            You can edit any field before confirming.
          </p>
        </div>
      )}
    </div>
  );
}
