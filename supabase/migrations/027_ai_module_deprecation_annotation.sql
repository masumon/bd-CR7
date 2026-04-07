-- ============================================================
-- Migration 027: AI Module Deprecation Annotation
-- ============================================================
-- The SUMONIX AI module has been removed from this application.
-- Tables below are RETAINED (no data loss) but access is
-- restricted and marked deprecated.
--
-- DO NOT DROP these tables without verifying no external
-- tooling or reporting depends on historical data.
-- ============================================================

-- Annotate deprecated tables with schema comments
COMMENT ON TABLE ai_interactions IS 'DEPRECATED — AI module removed. Retained for audit history only. No new rows will be written.';
COMMENT ON TABLE ai_memory IS 'DEPRECATED — AI module removed. pgvector embeddings retained for potential future use. No new rows will be written.';
COMMENT ON TABLE approval_suggestions IS 'DEPRECATED — AI governance module removed. Retained for historical reference. No new rows will be written.';

-- Revoke INSERT on deprecated AI tables from the API role
-- (SELECT/UPDATE retained for potential read-only reporting access)
DO $$
BEGIN
  -- ai_interactions: block new inserts from API service role
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_interactions') THEN
    EXECUTE 'REVOKE INSERT ON ai_interactions FROM authenticated';
  END IF;

  -- ai_memory: block new inserts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_memory') THEN
    EXECUTE 'REVOKE INSERT ON ai_memory FROM authenticated';
  END IF;

  -- approval_suggestions: block new inserts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_suggestions') THEN
    EXECUTE 'REVOKE INSERT ON approval_suggestions FROM authenticated';
  END IF;
END $$;
