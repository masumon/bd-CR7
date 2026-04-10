// MODULE LOCKED: HIGH RISK (NO AUTO REFACTOR ALLOWED)
// ONLY MANUAL VERIFIED CHANGES PERMITTED
"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ExpenseEditForm, ExpenseRow } from "@/modules/finance/types";

export function ExpenseDialogs({
  editTarget,
  setEditTarget,
  editForm,
  setEditForm,
  saving,
  mutationError,
  onSave,
  deleteTarget,
  setDeleteTarget,
  onDelete,
}: {
  editTarget: ExpenseRow | null;
  setEditTarget: (row: ExpenseRow | null) => void;
  editForm: ExpenseEditForm;
  setEditForm: (updater: (form: ExpenseEditForm) => ExpenseEditForm) => void;
  saving: boolean;
  mutationError: string;
  onSave: () => void;
  deleteTarget: string | null;
  setDeleteTarget: (id: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <>
      {editTarget && (
        <Dialog open title="Edit Expense" onClose={() => setEditTarget(null)}>
          <div className="space-y-3">
            <div>
              <label htmlFor="expense-edit-amount" className="mb-1 block text-xs text-muted-foreground">Amount</label>
              <input id="expense-edit-amount" type="number" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            <div>
              <label htmlFor="expense-edit-status" className="mb-1 block text-xs text-muted-foreground">Status</label>
              <select id="expense-edit-status" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div>
              <label htmlFor="expense-edit-description" className="mb-1 block text-xs text-muted-foreground">Description</label>
              <input id="expense-edit-description" type="text" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            <div>
              <label htmlFor="expense-edit-category" className="mb-1 block text-xs text-muted-foreground">Category</label>
              <input id="expense-edit-category" type="text" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            <div>
              <label htmlFor="expense-edit-subcategory" className="mb-1 block text-xs text-muted-foreground">Subcategory</label>
              <input id="expense-edit-subcategory" type="text" value={editForm.subcategory} onChange={(e) => setEditForm((f) => ({ ...f, subcategory: e.target.value }))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition" />
            </div>
            {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
            <div className="flex gap-2 pt-1">
              <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            </div>
          </div>
        </Dialog>
      )}

      {deleteTarget && (
        <Dialog open title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this expense? This action cannot be undone.</p>
          {mutationError && <p className="mb-2 text-xs text-rose-500">{mutationError}</p>}
          <div className="flex gap-2">
            <Button onClick={onDelete}>Delete</Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
