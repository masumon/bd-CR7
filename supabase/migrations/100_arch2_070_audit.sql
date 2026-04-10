---
-- Architecture 2: Audit Module
-- File: 070_audit.sql
-- Purpose: Compliance tracking, audit trails, regulatory records
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'warning',
  'non_compliant',
  'under_review'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Audit trail entries (detailed)
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Compliance records
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_type TEXT NOT NULL,  -- financial, workplace, data_protection, etc.
  entity_type TEXT,
  entity_id TEXT,
  status compliance_status DEFAULT 'under_review',
  details JSONB,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_records(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_compliance_entity ON compliance_records(entity_type, entity_id);

ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;

-- Audit sign-off records (for sensitive approvals)
CREATE TABLE IF NOT EXISTS audit_sign_offs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  signed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  attachments JSONB,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_sign_offs_signed_by ON audit_sign_offs(signed_by);
CREATE INDEX IF NOT EXISTS idx_audit_sign_offs_period ON audit_sign_offs(period_start, period_end);

ALTER TABLE audit_sign_offs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER compliance_records_updated_at_trigger
  BEFORE UPDATE ON compliance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Audit trails, compliance, sign-offs
-- Status: CLEAN (NO SEED DATA)
--
