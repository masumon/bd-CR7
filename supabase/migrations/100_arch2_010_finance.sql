---
-- Architecture 2: Finance System
-- File: 010_finance.sql
-- Purpose: Fund accounts, expenses, ledger, approvals, dual-approval framework
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE transaction_type AS ENUM (
  'credit',      -- Fund entry/deposit
  'expense',     -- Expense/payment
  'transfer',    -- Fund transfer between accounts
  'reversal',    -- Reversal/correction
  'adjustment'   -- Manual adjustment
);

CREATE TYPE approval_level AS ENUM (
  'auto_approved',      -- Auto-approved per policy
  'single_approval',    -- Single admin approval
  'dual_approval',      -- Two-admin approval required
  'rejected'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Fund accounts (financial accounts holding money)
CREATE TABLE IF NOT EXISTS fund_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_fund_accounts_owner ON fund_accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_fund_accounts_active ON fund_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_fund_accounts_created_at ON fund_accounts(created_at);

ALTER TABLE fund_accounts ENABLE ROW LEVEL SECURITY;

-- Fund transactions (ledger entries)
CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID REFERENCES fund_accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES fund_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  reference TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  second_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_status approval_status DEFAULT 'pending',
  approval_level approval_level,
  is_reversed BOOLEAN DEFAULT false,
  reverse_of UUID REFERENCES fund_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_fund_trans_from_account ON fund_transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_fund_trans_to_account ON fund_transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_fund_trans_created_by ON fund_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_fund_trans_approval_status ON fund_transactions(approval_status);
CREATE INDEX IF NOT EXISTS idx_fund_trans_created_at ON fund_transactions(created_at);

ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

-- Expenses (cost records)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES fund_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  second_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  risk_score INTEGER DEFAULT 0,
  receipt_url TEXT,
  transaction_date DATE,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_risk_score ON expenses(risk_score);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Pending approvals for sensitive operations
CREATE TABLE IF NOT EXISTS pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,  -- expense, fund_transfer, etc.
  entity_id TEXT NOT NULL,
  suggested_action TEXT,  -- approve, review, reject
  risk_score INTEGER DEFAULT 0,
  reason TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  suggested_by TEXT DEFAULT 'policy_engine',
  required_approvals INTEGER DEFAULT 2,
  approval_count INTEGER DEFAULT 0,
  first_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  second_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operation TEXT,  -- For sensitive operations
  operation_payload JSONB,
  sensitive BOOLEAN DEFAULT false,
  last_actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_app_status ON pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_pending_app_entity ON pending_approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pending_app_first_approver ON pending_approvals(first_approver_id);
CREATE INDEX IF NOT EXISTS idx_pending_app_second_approver ON pending_approvals(second_approver_id);
CREATE INDEX IF NOT EXISTS idx_pending_app_created_at ON pending_approvals(created_at);

ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

-- Finance policy settings
CREATE TABLE IF NOT EXISTS finance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  description TEXT,
  sensitive_amount_threshold NUMERIC(15, 2) DEFAULT 100000,
  sensitive_risk_threshold INTEGER DEFAULT 80,
  require_dual_approval_amount NUMERIC(15, 2) DEFAULT 50000,
  auto_approve_amount NUMERIC(15, 2) DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_finance_policy_name ON finance_policies(policy_name);
CREATE INDEX IF NOT EXISTS idx_finance_policy_active ON finance_policies(is_active);

ALTER TABLE finance_policies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Trigger for fund_accounts updated_at
CREATE TRIGGER fund_accounts_updated_at_trigger
  BEFORE UPDATE ON fund_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for fund_transactions updated_at
CREATE TRIGGER fund_trans_updated_at_trigger
  BEFORE UPDATE ON fund_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for expenses updated_at
CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for pending_approvals updated_at
CREATE TRIGGER pending_approvals_updated_at_trigger
  BEFORE UPDATE ON pending_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for finance_policies updated_at
CREATE TRIGGER finance_policies_updated_at_trigger
  BEFORE UPDATE ON finance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Credit fund account atomically
CREATE OR REPLACE FUNCTION credit_fund_account(
  p_account_id UUID,
  p_amount NUMERIC,
  p_actor_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE fund_accounts
  SET balance = balance + p_amount
  WHERE id = p_account_id
  RETURNING balance INTO new_balance;
  
  IF new_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Account not found');
  END IF;
  
  RETURN jsonb_build_object(
    'account_id', p_account_id,
    'amount', p_amount,
    'new_balance', new_balance,
    'actor_id', p_actor_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Debit fund account atomically
CREATE OR REPLACE FUNCTION debit_fund_account(
  p_account_id UUID,
  p_amount NUMERIC,
  p_actor_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  new_balance NUMERIC;
  current_balance NUMERIC;
BEGIN
  SELECT balance INTO current_balance FROM fund_accounts WHERE id = p_account_id;
  
  IF current_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Account not found');
  END IF;
  
  IF current_balance < p_amount THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;
  
  UPDATE fund_accounts
  SET balance = balance - p_amount
  WHERE id = p_account_id
  RETURNING balance INTO new_balance;
  
  RETURN jsonb_build_object(
    'account_id', p_account_id,
    'amount', p_amount,
    'new_balance', new_balance,
    'actor_id', p_actor_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---
-- STATUS: ✅ Ready
-- Contains: Fund accounts, transactions, expenses, approvals, policies
-- Status: CLEAN (NO SEED DATA)
--
