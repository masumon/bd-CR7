-- 007_production_safe_patch.sql
-- Idempotent, additive, production-safe migration.

CREATE EXTENSION IF NOT EXISTS vector;

-- Core extension tables.
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  action VARCHAR(80) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'logged',
  approved_by UUID,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  module VARCHAR(80) NOT NULL,
  prompt TEXT,
  response TEXT,
  metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'ok',
  approved_by UUID,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maker_checker_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NOT NULL,
  maker_id UUID,
  checker_id UUID,
  decision VARCHAR(20) NOT NULL DEFAULT 'pending',
  note TEXT,
  approved_by UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vector_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_by UUID,
  approved_by UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Extend existing tables safely.
ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS fund_transactions
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'posted',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS sales
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS material_movements
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS lc_records
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS landed_costs
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'calculated',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Foreign keys (safe and optional, idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_actor_user_id_fkey') THEN
    ALTER TABLE audit_logs
      ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_logs_user_id_fkey') THEN
    ALTER TABLE ai_logs
      ADD CONSTRAINT ai_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maker_checker_logs_maker_id_fkey') THEN
    ALTER TABLE maker_checker_logs
      ADD CONSTRAINT maker_checker_logs_maker_id_fkey FOREIGN KEY (maker_id) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maker_checker_logs_checker_id_fkey') THEN
    ALTER TABLE maker_checker_logs
      ADD CONSTRAINT maker_checker_logs_checker_id_fkey FOREIGN KEY (checker_id) REFERENCES users(id);
  END IF;
END $$;

-- Indexes.
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_created ON ai_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maker_checker_entity ON maker_checker_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vector_memory_created ON vector_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vector_memory_embedding ON vector_memory USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_expenses_status_created ON expenses(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status_created ON fund_transactions(status, created_at DESC);

-- updated_at trigger function.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_permissions_updated_at') THEN
    CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_logs_updated_at') THEN
    CREATE TRIGGER trg_audit_logs_updated_at BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_logs_updated_at') THEN
    CREATE TRIGGER trg_ai_logs_updated_at BEFORE UPDATE ON ai_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_maker_checker_logs_updated_at') THEN
    CREATE TRIGGER trg_maker_checker_logs_updated_at BEFORE UPDATE ON maker_checker_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vector_memory_updated_at') THEN
    CREATE TRIGGER trg_vector_memory_updated_at BEFORE UPDATE ON vector_memory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- RLS enablement.
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maker_checker_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vector_memory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='permissions' AND policyname='permissions_read_authenticated') THEN
    CREATE POLICY permissions_read_authenticated ON permissions FOR SELECT TO authenticated USING (is_deleted = FALSE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='audit_logs_admin_checker') THEN
    CREATE POLICY audit_logs_admin_checker ON audit_logs FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='maker_checker_logs' AND policyname='maker_checker_owner_or_admin') THEN
    CREATE POLICY maker_checker_owner_or_admin ON maker_checker_logs FOR ALL TO authenticated
    USING (maker_id = auth.uid() OR checker_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
    ))
    WITH CHECK (maker_id = auth.uid() OR checker_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vector_memory' AND policyname='vector_memory_authenticated') THEN
    CREATE POLICY vector_memory_authenticated ON vector_memory FOR ALL TO authenticated
    USING (is_deleted = FALSE)
    WITH CHECK (is_deleted = FALSE);
  END IF;
END $$;
