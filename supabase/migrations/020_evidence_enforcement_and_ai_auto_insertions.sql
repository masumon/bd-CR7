-- 020_evidence_enforcement_and_ai_auto_insertions.sql
-- Evidence enforcement rules + AI auto-insertion tracking
-- Additive only — no DROP, no ALTER of existing columns

-- ─── Evidence Enforcement Rules ──────────────────────────────────────────────
-- Defines which modules require a proof file before data can be saved.
-- is_active = TRUE means the rule is enforced in the UI.
CREATE TABLE IF NOT EXISTS evidence_enforcement_rules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module       TEXT        NOT NULL,  -- 'finance', 'materials', 'workforce', 'construction'
  rule_name    TEXT        NOT NULL,
  description  TEXT        NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  severity     TEXT        NOT NULL DEFAULT 'block'  -- 'block' | 'warn'
                CHECK (severity IN ('block', 'warn')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module, rule_name)
);

CREATE INDEX IF NOT EXISTS idx_eer_module    ON evidence_enforcement_rules (module);
CREATE INDEX IF NOT EXISTS idx_eer_is_active ON evidence_enforcement_rules (is_active);

ALTER TABLE evidence_enforcement_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'evidence_enforcement_rules'
      AND policyname = 'eer_authenticated'
  ) THEN
    CREATE POLICY "eer_authenticated"
      ON evidence_enforcement_rules FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed default rules (idempotent — conflict does nothing)
INSERT INTO evidence_enforcement_rules (module, rule_name, description, severity) VALUES
  ('finance',      'invoice_required',  'Every expense entry must have an invoice or receipt file',    'block'),
  ('materials',    'delivery_required', 'Every material IN movement must have a delivery note/photo',  'block'),
  ('workforce',    'work_proof',        'Every worker attendance log should have a photo or document', 'warn'),
  ('construction', 'progress_image',    'Every construction progress entry must have a photo',         'block')
ON CONFLICT (module, rule_name) DO NOTHING;

-- ─── AI Auto Insertions ───────────────────────────────────────────────────────
-- Logs every AI-suggested data insertion so the user can confirm/edit.
-- auto_applied = FALSE until the user clicks "Confirm".
CREATE TABLE IF NOT EXISTS ai_auto_insertions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id         UUID        NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  module          TEXT        NOT NULL,       -- detected module ('finance', 'materials', etc.)
  target_table    TEXT        NOT NULL,       -- DB table the AI wants to insert into
  extracted_data  JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- the proposed row fields
  auto_applied    BOOLEAN     NOT NULL DEFAULT FALSE,
  confirmed_by    UUID        NULL REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at    TIMESTAMPTZ NULL,
  rejected        BOOLEAN     NOT NULL DEFAULT FALSE,
  rejection_note  TEXT        NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aai_file_id     ON ai_auto_insertions (file_id);
CREATE INDEX IF NOT EXISTS idx_aai_module      ON ai_auto_insertions (module);
CREATE INDEX IF NOT EXISTS idx_aai_applied     ON ai_auto_insertions (auto_applied);
CREATE INDEX IF NOT EXISTS idx_aai_created_at  ON ai_auto_insertions (created_at DESC);

ALTER TABLE ai_auto_insertions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ai_auto_insertions'
      AND policyname = 'aai_authenticated'
  ) THEN
    CREATE POLICY "aai_authenticated"
      ON ai_auto_insertions FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Lightweight audit trigger for ai_auto_insertions ────────────────────────
CREATE OR REPLACE FUNCTION aai_audit_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.auto_applied = FALSE AND NEW.auto_applied = TRUE THEN
    INSERT INTO audit_logs(action_type, table_name, actor_name, old_values, new_values)
    VALUES ('UPDATE', 'ai_auto_insertions', current_user,
            row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS aai_audit_trigger ON ai_auto_insertions;
CREATE TRIGGER aai_audit_trigger
  AFTER UPDATE ON ai_auto_insertions
  FOR EACH ROW EXECUTE FUNCTION aai_audit_fn();

-- ─── Project-level summary view (safe read-only) ─────────────────────────────
-- Used by the Dashboard for cross-module stats. DROP VIEW first is safe — no data lost.
CREATE OR REPLACE VIEW v_project_module_summary AS
SELECT
  p.id                AS project_id,
  p.name              AS project_name,
  p.status            AS project_status,
  (SELECT COUNT(*) FROM project_files pf WHERE pf.project_id = p.id AND pf.status = 'active') AS total_files,
  (SELECT COUNT(*) FROM ai_auto_insertions aai
     JOIN project_files pf2 ON aai.file_id = pf2.id
     WHERE pf2.project_id = p.id AND aai.auto_applied = TRUE)  AS ai_insertions_applied,
  (SELECT COUNT(*) FROM expenses e WHERE e.metadata->>'project_id' = p.id::text) AS expense_count
FROM projects p;

-- Grant SELECT on view to authenticated
GRANT SELECT ON v_project_module_summary TO authenticated;
