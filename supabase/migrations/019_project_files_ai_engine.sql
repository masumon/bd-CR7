-- 019_project_files_ai_engine.sql
-- Centralized file system + AI classification log
-- Additive only — no DROP, no ALTER of existing data

-- ─── Unified file vault ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_files (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NULL REFERENCES projects(id) ON DELETE SET NULL,
  module          TEXT        NOT NULL DEFAULT 'general',
  category        TEXT        NOT NULL DEFAULT 'uncategorized',
  subcategory     TEXT        NULL,
  file_type       TEXT        NOT NULL DEFAULT 'image',
  file_url        TEXT        NOT NULL,
  thumbnail_url   TEXT        NULL,
  file_name       TEXT        NULL,
  file_size_bytes BIGINT      NULL,
  extracted_text  TEXT        NULL,
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  ai_classified   BOOLEAN     NOT NULL DEFAULT FALSE,
  ai_module       TEXT        NULL,
  ai_category     TEXT        NULL,
  ai_confidence   NUMERIC(5,4) NULL,
  uploaded_by     UUID        NULL REFERENCES users(id) ON DELETE SET NULL,
  ref_table       TEXT        NULL,
  ref_id          UUID        NULL,
  version         INT         NOT NULL DEFAULT 1,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'deleted', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pf_project_id  ON project_files (project_id);
CREATE INDEX IF NOT EXISTS idx_pf_module      ON project_files (module);
CREATE INDEX IF NOT EXISTS idx_pf_ref         ON project_files (ref_table, ref_id);
CREATE INDEX IF NOT EXISTS idx_pf_created_at  ON project_files (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pf_status      ON project_files (status);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pf_authenticated"
  ON project_files FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── AI classification events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_file_classifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id       UUID        NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  detected_type TEXT        NOT NULL,
  module        TEXT        NOT NULL,
  category      TEXT        NOT NULL,
  confidence    NUMERIC(5,4) NULL,
  extracted_data JSONB      NOT NULL DEFAULT '{}'::jsonb,
  auto_applied  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_fc_file_id    ON ai_file_classifications (file_id);
CREATE INDEX IF NOT EXISTS idx_ai_fc_created_at ON ai_file_classifications (created_at DESC);

ALTER TABLE ai_file_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ai_fc_authenticated"
  ON ai_file_classifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── Lightweight audit trigger for project_files ─────────────────────────────
CREATE OR REPLACE FUNCTION pf_audit_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs(action_type, table_name, actor_name, new_values)
    VALUES ('INSERT', 'project_files', current_user, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs(action_type, table_name, actor_name, old_values, new_values)
    VALUES ('UPDATE', 'project_files', current_user,
            row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs(action_type, table_name, actor_name, old_values)
    VALUES ('DELETE', 'project_files', current_user, row_to_json(OLD)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS pf_audit_trigger ON project_files;
CREATE TRIGGER pf_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_files
  FOR EACH ROW EXECUTE FUNCTION pf_audit_fn();
