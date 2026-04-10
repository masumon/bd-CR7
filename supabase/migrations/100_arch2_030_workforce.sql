---
-- Architecture 2: Workforce Module
-- File: 030_workforce.sql
-- Purpose: Workers, attendance, payroll, skills
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'late',
  'halfday',
  'leave'
);

CREATE TYPE payroll_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'held'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Workers
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  nid TEXT UNIQUE,
  date_of_birth DATE,
  address TEXT,
  designation TEXT,
  department TEXT,
  hire_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_rate NUMERIC(12, 2),
  monthly_rate NUMERIC(12, 2),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_nid ON workers(nid);
CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(is_active);
CREATE INDEX IF NOT EXISTS idx_workers_created_at ON workers(created_at);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Worker attendance logs
CREATE TABLE IF NOT EXISTS worker_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status attendance_status DEFAULT 'absent',
  checkin_time TIME,
  checkout_time TIME,
  hours_worked NUMERIC(5, 2),
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_worker_logs_worker_id ON worker_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_logs_date ON worker_logs(attendance_date);
CREATE INDEX IF NOT EXISTS idx_worker_logs_project_id ON worker_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_logs_created_at ON worker_logs(created_at);

ALTER TABLE worker_logs ENABLE ROW LEVEL SECURITY;

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  days_worked INTEGER,
  gross_amount NUMERIC(15, 2),
  deductions NUMERIC(15, 2) DEFAULT 0,
  net_amount NUMERIC(15, 2),
  status payroll_status DEFAULT 'pending',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_date DATE,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payroll_worker_id ON payroll(worker_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_created_at ON payroll(created_at);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Worker skills
CREATE TABLE IF NOT EXISTS worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency TEXT,  -- beginner, intermediate, advanced, expert
  certified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_skills_worker_id ON worker_skills(worker_id);

ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER workers_updated_at_trigger
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER worker_logs_updated_at_trigger
  BEFORE UPDATE ON worker_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payroll_updated_at_trigger
  BEFORE UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Workers, attendance, payroll, skills
-- Status: CLEAN (NO SEED DATA)
--
