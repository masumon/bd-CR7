-- 002_production_hardening.sql
-- Additive, non-destructive hardening migration.

CREATE EXTENSION IF NOT EXISTS "vector";

-- Ensure role seed data exists.
INSERT INTO roles (name, description)
VALUES
('maker', 'Can create/update pending records'),
('checker', 'Can approve or reject maker records'),
('viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Expense approvals (maker-checker flow).
ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS maker_id UUID,
  ADD COLUMN IF NOT EXISTS checker_id UUID,
  ADD COLUMN IF NOT EXISTS approval_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- POS consistency columns/indexes.
ALTER TABLE IF EXISTS sales
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_sales_inventory_id ON sales (inventory_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales (sold_at);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance (worker_id, date);
CREATE INDEX IF NOT EXISTS idx_funds_sender_receiver ON funds (sender_id, receiver_id);

-- AI memory vector index.
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_embedding
ON ai_knowledge_base USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- RLS enablement (idempotent).
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;

-- Read policies.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_read_authenticated'
  ) THEN
    CREATE POLICY expenses_read_authenticated
    ON expenses FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_insert_maker'
  ) THEN
    CREATE POLICY expenses_insert_maker
    ON expenses FOR INSERT
    TO authenticated
    WITH CHECK (
      status = 'pending'
      AND maker_id = auth.uid()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_update_checker'
  ) THEN
    CREATE POLICY expenses_update_checker
    ON expenses FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (
      checker_id = auth.uid()
      AND status IN ('approved', 'rejected')
      AND checker_id IS DISTINCT FROM maker_id
    );
  END IF;
END $$;
