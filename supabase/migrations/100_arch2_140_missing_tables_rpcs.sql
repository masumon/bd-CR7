---
-- Architecture 2: Missing Tables & RPC Functions
-- File: 140_missing_tables_rpcs.sql
-- Purpose: Add attendance table, project_timeline_events table,
--          create_expense_atomic RPC, approve_expense_atomic RPC,
--          and minimal sales table for dashboard fallback.
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ATTENDANCE TABLE
-- Geofenced worker check-in records (separate from worker_logs payroll ledger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (worker_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROJECT TIMELINE EVENTS TABLE
-- Fine-grained timeline events per project (distinct from project_timeline milestones)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pte_project_id ON project_timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_pte_event_date ON project_timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_pte_created_at ON project_timeline_events(created_at);

ALTER TABLE project_timeline_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SALES TABLE
-- Minimal table for dashboard_metrics fallback query
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RPC: create_expense_atomic
-- Creates an expense record atomically and returns expense_id + status
-- ============================================================================

CREATE OR REPLACE FUNCTION create_expense_atomic(
  p_account_id UUID,
  p_category_id TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_maker_id UUID,
  p_risk_level TEXT DEFAULT 'low',
  p_risk_score INTEGER DEFAULT 0
)
RETURNS TABLE (expense_id UUID, status TEXT) AS $$
DECLARE
  new_expense_id UUID := gen_random_uuid();
  initial_status TEXT := 'pending';
BEGIN
  -- Validate account exists
  IF NOT EXISTS (SELECT 1 FROM fund_accounts WHERE id = p_account_id AND is_active = true) THEN
    RAISE EXCEPTION 'Account not found or inactive';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Expense amount must be greater than zero';
  END IF;

  INSERT INTO expenses (
    id,
    account_id,
    amount,
    category,
    description,
    status,
    created_by,
    risk_score,
    metadata
  ) VALUES (
    new_expense_id,
    p_account_id,
    p_amount,
    COALESCE(p_category_id, 'general'),
    p_description,
    initial_status,
    p_maker_id,
    p_risk_score,
    jsonb_build_object('risk_level', p_risk_level, 'risk_score', p_risk_score)
  );

  RETURN QUERY SELECT new_expense_id, initial_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: approve_expense_atomic
-- Approves or rejects an expense atomically, enforcing maker-checker separation
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_expense_atomic(
  p_expense_id UUID,
  p_decision TEXT,         -- 'approved' or 'rejected'
  p_note TEXT,
  p_checker_id UUID,
  p_checker_role TEXT DEFAULT 'checker'
)
RETURNS VOID AS $$
DECLARE
  expense_row expenses%ROWTYPE;
BEGIN
  SELECT * INTO expense_row
  FROM expenses
  WHERE id = p_expense_id
  FOR UPDATE;

  IF expense_row.id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF expense_row.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending expenses can be approved or rejected';
  END IF;

  IF expense_row.created_by = p_checker_id THEN
    RAISE EXCEPTION 'Self-approval is not permitted';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  UPDATE expenses
  SET
    status       = p_decision,
    approved_by  = p_checker_id,
    metadata     = COALESCE(metadata, '{}'::jsonb) ||
                   jsonb_build_object(
                     'approval_note',   p_note,
                     'approved_at',     NOW(),
                     'checker_role',    p_checker_role
                   ),
    updated_at   = NOW()
  WHERE id = p_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---
-- STATUS: ✅ Ready
-- Contains: attendance, project_timeline_events, sales tables;
--           create_expense_atomic, approve_expense_atomic RPC functions
-- Status: CLEAN (NO SEED DATA)
--
