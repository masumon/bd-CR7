-- Additive migration: biometric credentials, approval intelligence, notifications, reports, and workspace preferences.
-- Non-destructive by design: creates missing tables/indexes only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  credential_id TEXT NOT NULL,
  device_name TEXT NULL,
  transports JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sign_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, credential_id)
);

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS credential_id TEXT;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS device_name TEXT;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS transports JSONB;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS sign_count BIGINT;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS biometric_credentials
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE biometric_credentials ALTER COLUMN transports SET DEFAULT '[]'::jsonb;
ALTER TABLE biometric_credentials ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE biometric_credentials ALTER COLUMN sign_count SET DEFAULT 0;
ALTER TABLE biometric_credentials ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE biometric_credentials ALTER COLUMN updated_at SET DEFAULT now();

UPDATE biometric_credentials SET transports = '[]'::jsonb WHERE transports IS NULL;
UPDATE biometric_credentials SET is_active = TRUE WHERE is_active IS NULL;
UPDATE biometric_credentials SET sign_count = 0 WHERE sign_count IS NULL;
UPDATE biometric_credentials SET created_at = now() WHERE created_at IS NULL;
UPDATE biometric_credentials SET updated_at = now() WHERE updated_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'biometric_credentials_user_id_fkey'
  ) THEN
    ALTER TABLE biometric_credentials
      ADD CONSTRAINT biometric_credentials_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_biometric_credentials_user_credential
  ON biometric_credentials (user_id, credential_id);

CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON biometric_credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_active ON biometric_credentials (is_active);

CREATE TABLE IF NOT EXISTS decision_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  risk_threshold INTEGER NOT NULL DEFAULT 80,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  suggested_action TEXT NOT NULL DEFAULT 'review',
  risk_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  suggested_by TEXT NOT NULL DEFAULT 'sumonix_ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals (status);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_created_at ON pending_approvals (created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS severity TEXT;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE notifications ALTER COLUMN severity SET DEFAULT 'info';
ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT FALSE;
ALTER TABLE notifications ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
ALTER TABLE notifications ALTER COLUMN created_at SET DEFAULT now();

UPDATE notifications SET severity = 'info' WHERE severity IS NULL;
UPDATE notifications SET is_read = FALSE WHERE is_read IS NULL;
UPDATE notifications SET metadata = '{}'::jsonb WHERE metadata IS NULL;
UPDATE notifications SET created_at = now() WHERE created_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key TEXT NOT NULL,
  period_label TEXT NOT NULL,
  generated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_report_key ON report_snapshots (report_key);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_generated_at ON report_snapshots (generated_at DESC);

CREATE TABLE IF NOT EXISTS workspace_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  theme TEXT NOT NULL DEFAULT 'light',
  language TEXT NOT NULL DEFAULT 'en',
  integrations JSONB NOT NULL DEFAULT '{"cloudinary": true, "realtime": true, "aiVoice": true, "offlineSync": true}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS workspace_preferences
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE IF EXISTS workspace_preferences
  ADD COLUMN IF NOT EXISTS theme TEXT;

ALTER TABLE IF EXISTS workspace_preferences
  ADD COLUMN IF NOT EXISTS language TEXT;

ALTER TABLE IF EXISTS workspace_preferences
  ADD COLUMN IF NOT EXISTS integrations JSONB;

ALTER TABLE IF EXISTS workspace_preferences
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE workspace_preferences ALTER COLUMN theme SET DEFAULT 'light';
ALTER TABLE workspace_preferences ALTER COLUMN language SET DEFAULT 'en';
ALTER TABLE workspace_preferences ALTER COLUMN integrations SET DEFAULT '{"cloudinary": true, "realtime": true, "aiVoice": true, "offlineSync": true}'::jsonb;
ALTER TABLE workspace_preferences ALTER COLUMN updated_at SET DEFAULT now();

UPDATE workspace_preferences SET theme = 'light' WHERE theme IS NULL;
UPDATE workspace_preferences SET language = 'en' WHERE language IS NULL;
UPDATE workspace_preferences
SET integrations = '{"cloudinary": true, "realtime": true, "aiVoice": true, "offlineSync": true}'::jsonb
WHERE integrations IS NULL;
UPDATE workspace_preferences SET updated_at = now() WHERE updated_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_preferences_user_id_fkey'
  ) THEN
    ALTER TABLE workspace_preferences
      ADD CONSTRAINT workspace_preferences_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_preferences_user_id ON workspace_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_preferences_user_id ON workspace_preferences (user_id);
