-- 018_safe_upgrade.sql
-- Safe performance & integrity improvements.
-- NO table drops, NO column removals, NO data modifications.
-- Execute manually via Supabase dashboard SQL editor.

BEGIN;

-- ─── Performance Indexes ─────────────────────────────────────────────────────
-- These columns are used as high-frequency WHERE filters in the API layer.
-- CREATE INDEX IF NOT EXISTS is safe to run multiple times.

CREATE INDEX IF NOT EXISTS idx_expenses_status
  ON public.expenses (status);

CREATE INDEX IF NOT EXISTS idx_expenses_created_at
  ON public.expenses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_maker_id
  ON public.expenses (maker_id);

CREATE INDEX IF NOT EXISTS idx_workers_is_active
  ON public.workers (is_active);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_direction
  ON public.fund_transactions (direction);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at
  ON public.fund_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approvals_status
  ON public.approvals (status);

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON public.projects (status);

CREATE INDEX IF NOT EXISTS idx_worker_logs_worker_id
  ON public.worker_logs (worker_id);

-- ─── AI Memory Vector Index ──────────────────────────────────────────────────
-- ivfflat index for approximate nearest-neighbour search on 1536-dim embeddings.
-- Requires pgvector >= 0.4. Safe to skip if the table has no rows yet.
CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding
  ON public.ai_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Expense Category Partial Index ─────────────────────────────────────────
-- Speeds up the category breakdown query used by the dashboard hook.
CREATE INDEX IF NOT EXISTS idx_expenses_approved_category
  ON public.expenses (category_id, created_at DESC)
  WHERE status = 'approved';

COMMIT;
