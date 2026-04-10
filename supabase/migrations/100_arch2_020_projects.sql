---
-- Architecture 2: Projects Module
-- File: 020_projects.sql
-- Purpose: Project management, timeline, milestones, attachments
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- ENUMS  
-- ============================================================================

CREATE TYPE project_status AS ENUM (
  'planning',
  'active',
  'paused',
  'completed',
  'cancelled'
);

CREATE TYPE milestone_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'delayed',
  'cancelled'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  budget NUMERIC(15, 2),
  spent NUMERIC(15, 2) DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  category TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project timeline entries
CREATE TABLE IF NOT EXISTS project_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  milestone_status milestone_status DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_project_timeline_project ON project_timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_project_timeline_scheduled_date ON project_timeline(scheduled_date);

ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;

-- Project attachments/media
CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  attachment_type TEXT,  -- photo, document, report, other
  description TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_attachments_project ON project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_uploaded_by ON project_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_attachments_created_at ON project_attachments(created_at);

ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER project_timeline_updated_at_trigger
  BEFORE UPDATE ON project_timeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Projects, timeline, milestones, attachments
-- Status: CLEAN (NO SEED DATA)
--
