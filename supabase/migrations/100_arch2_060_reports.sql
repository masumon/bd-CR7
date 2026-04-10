---
-- Architecture 2: Reports Module
-- File: 060_reports.sql
-- Purpose: Report definitions, analytics, dashboards
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- TABLES
-- ============================================================================

-- Report definitions
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL UNIQUE,
  description TEXT,
  report_type TEXT NOT NULL,  -- finance, workforce, projects, materials, etc.
  query_sql TEXT,
  parameters JSONB,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_active ON reports(is_active);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Saved report runs
CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  run_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  run_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  result_rows INTEGER,
  result_data JSONB,
  execution_time_ms INTEGER,
  parameters_used JSONB
);

CREATE INDEX IF NOT EXISTS idx_report_runs_report_id ON report_runs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_run_date ON report_runs(run_date);

ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,  -- kpi, chart, table, etc.
  widget_title TEXT,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  position INTEGER,
  width TEXT DEFAULT '1',  -- 1, 2, 3 (grid columns)
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER reports_updated_at_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER dashboard_widgets_updated_at_trigger
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Reports, analytics, dashboards
-- Status: CLEAN (NO SEED DATA)
--
