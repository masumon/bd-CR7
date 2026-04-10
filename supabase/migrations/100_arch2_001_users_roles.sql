---
-- Architecture 2: Database Initialization
-- File: 001_users_roles.sql  
-- Purpose: Users, roles, and RBAC foundation
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'checker',
  'maker',
  'supervisor',
  'engineer',
  'mason',
  'worker'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'applied',
  'dismissed',
  'rejected'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  auth_email TEXT,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'worker',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  profile_image_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- RLS policy: Each user can view own profile and admin can view all
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_read ON users
  FOR SELECT
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  meta JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- RLS policy: Users can view own audit entries, admins can view all
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_self_read ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin');

-- Workspace preferences table
CREATE TABLE IF NOT EXISTS workspace_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',  -- 'light' | 'dark'
  language TEXT DEFAULT 'en',  -- 'en' | 'bn'
  notifications_enabled BOOLEAN DEFAULT true,
  offline_mode_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_pref_user_id ON workspace_preferences(user_id);

ALTER TABLE workspace_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_pref_self_update ON workspace_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users updated_at
CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for workspace_preferences updated_at
CREATE TRIGGER workspace_pref_updated_at_trigger
  BEFORE UPDATE ON workspace_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL ROLE CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role FROM users WHERE id = auth.uid();
  RETURN current_role = ANY(required_roles::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---
-- STATUS: ✅ Ready
-- Contains: Users, roles, audit, preferences
-- Status: CLEAN (NO SEED DATA)
--
