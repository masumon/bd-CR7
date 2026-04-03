-- Additive migration: AI interaction audit logging + project timeline/attachments.
-- Safe-by-default: creates only missing objects, does not alter or drop existing schema/data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  intent TEXT NOT NULL DEFAULT 'general',
  response TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions (user_id);

CREATE TABLE IF NOT EXISTS project_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  event_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_timeline_events_project_id ON project_timeline_events (project_id);
CREATE INDEX IF NOT EXISTS idx_project_timeline_events_event_date ON project_timeline_events (event_date);

CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NULL,
  file_name TEXT NULL,
  caption TEXT NULL,
  uploaded_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON project_attachments (project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_created_at ON project_attachments (created_at DESC);
