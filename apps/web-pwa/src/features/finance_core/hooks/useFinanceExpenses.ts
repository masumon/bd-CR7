"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/store/authStore";

import type { ExpenseEditForm, ExpenseRow } from "@/features/finance_core/types";
import { deleteExpense, fetchExpenses, updateExpense } from "@/features/finance_core/services/expenseService";

export function useFinanceExpenses() {
  const token = useAuthStore((state) => state.token ?? undefined);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ExpenseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [editForm, setEditForm] = useState<ExpenseEditForm>({ amount: 0, status: "pending", description: "", category: "", subcategory: "" });

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setRows(await fetchExpenses(token));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const pendingApprovals = rows.filter((r) => String(r.status).toLowerCase() === "pending").length;
  const approvedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rows
      .filter((r) => String(r.status).toLowerCase() === "approved" && (r.created_at || "").slice(0, 10) === today)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [rows]);
  const receiptsMissing = rows.filter((r) => !r.receipt_url).length;

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const metaCategory = typeof row.metadata?.category === "string" ? row.metadata.category : "";
      const category = metaCategory || row.description?.split(" ")[0] || "General";
      totals[category] = (totals[category] || 0) + Number(row.amount || 0);
    }
    const list = Object.entries(totals).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 4);
    const max = list[0]?.value || 1;
    return list.map((item) => ({ ...item, widthPct: Math.max(8, Math.round((item.value / max) * 100)) }));
  }, [rows]);

  const subcategoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const subcategory = typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "General";
      totals[subcategory] = (totals[subcategory] || 0) + Number(row.amount || 0);
    }
    return Object.entries(totals).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [rows]);

  const buildExportRows = useCallback(() => {
    return rows.map((row) => {
      const category = typeof row.metadata?.category === "string" ? row.metadata.category : row.description?.split(" ")[0] || "General";
      const subcategory = typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "General";
      return { id: row.id, category, subcategory, amount: Number(row.amount || 0), status: String(row.status), createdAt: row.created_at || "" };
    });
  }, [rows]);

  const openEdit = (row: ExpenseRow) => {
    setEditForm({
      amount: Number(row.amount),
      status: String(row.status),
      description: row.description ?? "",
      category: typeof row.metadata?.category === "string" ? row.metadata.category : "",
      subcategory: typeof row.metadata?.subcategory === "string" ? row.metadata.subcategory : "",
    });
    setEditTarget(row);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setMutationError("");
    const error = await updateExpense(editTarget.id, editForm, token);
    setSaving(false);
    if (error) {
      setMutationError(error);
      return;
    }
    setEditTarget(null);
    await loadExpenses();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setMutationError("");
    const error = await deleteExpense(deleteTarget, token);
    if (error) {
      setMutationError(error);
      return;
    }
    setDeleteTarget(null);
    await loadExpenses();
  };

  return {
    open,
    setOpen,
    rows,
    loading,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    saving,
    mutationError,
    editForm,
    setEditForm,
    loadExpenses,
    pendingApprovals,
    approvedToday,
    receiptsMissing,
    categoryBreakdown,
    subcategoryBreakdown,
    buildExportRows,
    openEdit,
    submitEdit,
    confirmDelete,
  };
}
