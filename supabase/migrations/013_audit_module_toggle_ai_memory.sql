-- ============================================================
-- BD CR7 ERP – Database Fix Migration
-- File: 013_audit_module_toggle_ai_memory.sql
-- Purpose: Add audit_logs, module_toggles, and ai_memory_logs
--          tables required by the new Audit module and Module
--          Control system. Safe to run on existing databases.
-- ============================================================

-- ──────────────────────────────────────────
-- 1. AUDIT LOGS TABLE
--    Tracks INSERT / UPDATE / DELETE events
--    across all ERP tables via triggers.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name  TEXT,
  record_id   TEXT,
  changed_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

-- Index for per-table queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
  ON public.audit_logs (table_name);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin and Admin can read audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_admin_read'
  ) THEN
    CREATE POLICY audit_logs_admin_read ON public.audit_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
      );
  END IF;
END $$;

-- System (service role) can insert logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_system_insert'
  ) THEN
    CREATE POLICY audit_logs_system_insert ON public.audit_logs
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ──────────────────────────────────────────
-- 2. GENERIC AUDIT TRIGGER FUNCTION
--    Attach to any table with:
--    CREATE TRIGGER trg_audit_<table>
--      AFTER INSERT OR UPDATE OR DELETE ON <table>
--      FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, table_name, record_id, changed_by, new_data)
    VALUES (
      'INSERT',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      (SELECT auth.uid()),
      to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (action, table_name, record_id, changed_by, old_data, new_data)
    VALUES (
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      (SELECT auth.uid()),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, table_name, record_id, changed_by, old_data)
    VALUES (
      'DELETE',
      TG_TABLE_NAME,
      OLD.id::TEXT,
      (SELECT auth.uid()),
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Attach audit trigger to key ERP tables (idempotent)
DO $$
DECLARE
  tbl TEXT;
  tbl_list TEXT[] := ARRAY['expenses', 'fund_transactions', 'worker_logs', 'material_logs', 'projects', 'approvals'];
BEGIN
  FOREACH tbl IN ARRAY tbl_list LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'trg_audit_' || tbl AND event_object_table = tbl
      ) THEN
        EXECUTE format(
          'CREATE TRIGGER trg_audit_%I
           AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()',
           tbl, tbl
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ──────────────────────────────────────────
-- 3. MODULE TOGGLES TABLE
--    Stores per-workspace dynamic module state
--    (mirrors client-side moduleStore but persisted
--     server-side for multi-device support).
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.module_toggles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,                 -- nullable: global config if NULL
  module_key  TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (workspace_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_module_toggles_workspace
  ON public.module_toggles (workspace_id, module_key);

ALTER TABLE public.module_toggles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'module_toggles' AND policyname = 'module_toggles_admin_all'
  ) THEN
    CREATE POLICY module_toggles_admin_all ON public.module_toggles
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'module_toggles' AND policyname = 'module_toggles_authenticated_read'
  ) THEN
    CREATE POLICY module_toggles_authenticated_read ON public.module_toggles
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ──────────────────────────────────────────
-- 4. AI MEMORY LOGS TABLE
--    Stores SUMONIX AI conversation memory
--    and learned patterns per user / workspace.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_memory_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id    TEXT,
  memory_type   TEXT NOT NULL DEFAULT 'context',  -- context | pattern | insight
  content       TEXT NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ             -- NULL = permanent memory
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_user
  ON public.ai_memory_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_memory_session
  ON public.ai_memory_logs (session_id);

-- Partial index for non-expired memories
CREATE INDEX IF NOT EXISTS idx_ai_memory_active
  ON public.ai_memory_logs (user_id)
  WHERE expires_at IS NULL OR expires_at > now();

ALTER TABLE public.ai_memory_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own memory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_memory_logs' AND policyname = 'ai_memory_own_user'
  ) THEN
    CREATE POLICY ai_memory_own_user ON public.ai_memory_logs
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ──────────────────────────────────────────
-- 5. SEED DEFAULT MODULE TOGGLE ROWS
--    (global defaults, workspace_id = NULL)
-- ──────────────────────────────────────────
INSERT INTO public.module_toggles (module_key, enabled, workspace_id)
VALUES
  ('import_lc',           false, NULL),
  ('pos',                 false, NULL),
  ('crm',                 false, NULL),
  ('contractor',          false, NULL),
  ('inventory_advanced',  false, NULL)
ON CONFLICT (workspace_id, module_key) DO NOTHING;

-- ──────────────────────────────────────────
-- END OF MIGRATION 013
-- ──────────────────────────────────────────
