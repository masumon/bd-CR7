-- 018_safe_upgrade.sql
-- Safe performance indexes — NO data changes, NO schema changes.
-- Each index is wrapped in a DO block that skips if the table does not yet exist.
-- Safe to re-run multiple times.

-- ─── expenses ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_status        ON public.expenses (status);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at    ON public.expenses (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_maker_id      ON public.expenses (maker_id);
    -- Partial index used by dashboard category-breakdown query
    CREATE INDEX IF NOT EXISTS idx_expenses_approved_cat
      ON public.expenses (category_id, created_at DESC)
      WHERE status = 'approved';
  END IF;
END $$;

-- ─── workers ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers') THEN
    CREATE INDEX IF NOT EXISTS idx_workers_is_active ON public.workers (is_active);
  END IF;
END $$;

-- ─── worker_logs ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_worker_logs_worker_id ON public.worker_logs (worker_id);
  END IF;
END $$;

-- ─── fund_transactions ───────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fund_transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_fund_txn_direction   ON public.fund_transactions (direction);
    CREATE INDEX IF NOT EXISTS idx_fund_txn_created_at  ON public.fund_transactions (created_at DESC);
  END IF;
END $$;

-- ─── audit_logs ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
  END IF;
END $$;

-- ─── approvals ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approvals') THEN
    CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals (status);
  END IF;
END $$;

-- ─── projects ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
  END IF;
END $$;

-- ─── ai_memory (vector index) ────────────────────────────────────────────────
-- ivfflat requires at least ~1000 rows to be useful. Safe to skip on empty table.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_memory') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding
      ON public.ai_memory USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  END IF;
END $$;
