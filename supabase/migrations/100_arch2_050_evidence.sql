---
-- Architecture 2: Evidence Module
-- File: 050_evidence.sql
-- Purpose: Evidence management, file uploads, compliance tracking
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE evidence_type AS ENUM (
  'receipt',
  'invoice',
  'photo',
  'video',
  'document',
  'inspection',
  'proof_of_work',
  'other'
);

CREATE TYPE evidence_status AS ENUM (
  'uploaded',
  'verified',
  'approved',
  'rejected',
  'archived'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Evidence records
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,  -- expense, project, worker, material, etc.
  entity_id UUID NOT NULL,
  evidence_type evidence_type NOT NULL,
  status evidence_status DEFAULT 'uploaded',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  description TEXT,
  tags TEXT[],
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_evidence_entity ON evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence(created_at);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Evidence approvals (for compliance/sensitive evidence)
CREATE TABLE IF NOT EXISTS evidence_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,  -- approved, rejected
  comments TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_evidence_approvals_evidence_id ON evidence_approvals(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_approvals_approver_id ON evidence_approvals(approver_id);

ALTER TABLE evidence_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER evidence_updated_at_trigger
  BEFORE UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Evidence management, file tracking, approvals
-- Status: CLEAN (NO SEED DATA)
--
