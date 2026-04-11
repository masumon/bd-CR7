---
-- Architecture 2: Upload Compatibility
-- File: 055_uploads.sql
-- Purpose: Restore shared upload metadata used by the web app and align
--          project attachment columns with the current API/frontend contract.
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- TABLES
-- ============================================================================

-- Centralized upload metadata for cross-module file tracking.
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name TEXT,
  description TEXT,
  file_size_bytes INTEGER,
  extracted_text TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ai_classified BOOLEAN NOT NULL DEFAULT false,
  ai_module TEXT,
  ai_category TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ref_table TEXT,
  ref_id TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_module_category ON project_files(module, category);
CREATE INDEX IF NOT EXISTS idx_project_files_ref_lookup ON project_files(ref_table, ref_id);
CREATE INDEX IF NOT EXISTS idx_project_files_status ON project_files(status);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_files'
      AND policyname = 'project_files_select_authenticated'
  ) THEN
    CREATE POLICY project_files_select_authenticated
      ON project_files
      FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_files'
      AND policyname = 'project_files_insert_own'
  ) THEN
    CREATE POLICY project_files_insert_own
      ON project_files
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND uploaded_by = auth.uid()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_files'
      AND policyname = 'project_files_update_owner_or_admin'
  ) THEN
    CREATE POLICY project_files_update_owner_or_admin
      ON project_files
      FOR UPDATE
      TO authenticated
      USING (
        uploaded_by = auth.uid()
        OR check_user_role(ARRAY['super_admin', 'admin', 'checker'])
      )
      WITH CHECK (
        uploaded_by = auth.uid()
        OR check_user_role(ARRAY['super_admin', 'admin', 'checker'])
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON project_files TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'project_files_updated_at_trigger'
  ) THEN
    CREATE TRIGGER project_files_updated_at_trigger
      BEFORE UPDATE ON project_files
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- COMPATIBILITY PATCHES
-- ============================================================================

-- The current projects API/frontend use `caption`, while the older migration
-- defined `description`. Keep both compatible so uploads stop failing.
ALTER TABLE project_attachments
  ADD COLUMN IF NOT EXISTS caption TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_attachments'
      AND column_name = 'description'
  ) THEN
    EXECUTE '
      UPDATE public.project_attachments
      SET caption = COALESCE(caption, description)
      WHERE caption IS NULL
        AND description IS NOT NULL
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_attachments'
      AND policyname = 'project_attachments_select_authenticated'
  ) THEN
    CREATE POLICY project_attachments_select_authenticated
      ON project_attachments
      FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_attachments'
      AND policyname = 'project_attachments_insert_own'
  ) THEN
    CREATE POLICY project_attachments_insert_own
      ON project_attachments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND uploaded_by = auth.uid()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_attachments'
      AND policyname = 'project_attachments_update_owner_or_admin'
  ) THEN
    CREATE POLICY project_attachments_update_owner_or_admin
      ON project_attachments
      FOR UPDATE
      TO authenticated
      USING (
        uploaded_by = auth.uid()
        OR check_user_role(ARRAY['super_admin', 'admin', 'checker'])
      )
      WITH CHECK (
        uploaded_by = auth.uid()
        OR check_user_role(ARRAY['super_admin', 'admin', 'checker'])
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON project_attachments TO authenticated;

-- Ask PostgREST to refresh the exposed schema after these compatibility fixes.
NOTIFY pgrst, 'reload schema';

---
-- STATUS: ✅ Ready
-- Contains: Centralized upload metadata + attachment compatibility patch
-- Status: CLEAN (NO SEED DATA)
--
