---
-- Architecture 2: Dynamic Module — Custom Fields & Workflow Configurations
-- File: 130_dynamic.sql
-- Purpose: Tables for user-defined custom fields and workflow configurations
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- TABLES
-- ============================================================================

-- Custom field definitions attached to entities (projects, workers, etc.)
CREATE TABLE IF NOT EXISTS custom_fields (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL,  -- project | worker | material | contractor | transaction
  name            TEXT        NOT NULL,  -- machine-readable identifier
  label           TEXT        NOT NULL,  -- human-readable display label
  type            TEXT        NOT NULL,  -- text | number | date | boolean | select | multi_select | file
  required        BOOLEAN     NOT NULL DEFAULT false,
  options         JSONB,                 -- for select / multi_select types
  validation_rules JSONB,               -- optional validation constraints
  order_index     INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT custom_fields_entity_type_check
    CHECK (entity_type IN ('project', 'worker', 'material', 'contractor', 'transaction')),
  CONSTRAINT custom_fields_type_check
    CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multi_select', 'file'))
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_entity_type ON custom_fields(entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_active      ON custom_fields(is_active);

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_fields_read_all ON custom_fields
  FOR SELECT USING (true);

CREATE POLICY custom_fields_admin_write ON custom_fields
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Workflow configuration definitions
CREATE TABLE IF NOT EXISTS workflow_configs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  description          TEXT,
  workflow_type        TEXT        NOT NULL DEFAULT 'custom',
  steps                JSONB       NOT NULL DEFAULT '[]'::jsonb,
  applicable_entities  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  created_by           UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_configs_type   ON workflow_configs(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_configs_active ON workflow_configs(is_active);

ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_configs_read_all ON workflow_configs
  FOR SELECT USING (true);

CREATE POLICY workflow_configs_admin_write ON workflow_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER custom_fields_updated_at_trigger
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER workflow_configs_updated_at_trigger
  BEFORE UPDATE ON workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: custom_fields, workflow_configs
-- Depends on: 001_users_roles.sql (users table, update_updated_at_column function)
---
