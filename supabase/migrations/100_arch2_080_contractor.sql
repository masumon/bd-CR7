---
-- Architecture 2: Contractor Module
-- File: 080_contractor.sql
-- Purpose: Contractor management, contracts, payments
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE contract_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
  'archived'
);

CREATE TYPE contract_type AS ENUM (
  'labor',
  'supplies',
  'services',
  'consulting',
  'other'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_name TEXT NOT NULL,
  contractor_type TEXT,  -- individual, company
  phone TEXT,
  email TEXT,
  company_name TEXT,
  specialization TEXT,
  nid TEXT UNIQUE,
  tax_id TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3, 1),
  total_worked_amount NUMERIC(15, 2) DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_contractors_name ON contractors(contractor_name);
CREATE INDEX IF NOT EXISTS idx_contractors_active ON contractors(is_active);
CREATE INDEX IF NOT EXISTS idx_contractors_created_at ON contractors(created_at);

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contract_title TEXT NOT NULL,
  contract_type contract_type NOT NULL,
  status contract_status DEFAULT 'draft',
  contract_amount NUMERIC(15, 2) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  payment_terms TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  document_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_contracts_contractor_id ON contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Contractor payments
CREATE TABLE IF NOT EXISTS contractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  payment_amount NUMERIC(15, 2) NOT NULL,
  payment_date DATE,
  payment_method TEXT,  -- cash, bank, check, digital
  reference_number TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'pending',  -- pending, approved, paid
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_contractor_payments_contract ON contractor_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_contractor ON contractor_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_status ON contractor_payments(status);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_created_at ON contractor_payments(created_at);

ALTER TABLE contractor_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER contractors_updated_at_trigger
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER contracts_updated_at_trigger
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER contractor_payments_updated_at_trigger
  BEFORE UPDATE ON contractor_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Contractors, contracts, payments
-- Status: CLEAN (NO SEED DATA)
--
