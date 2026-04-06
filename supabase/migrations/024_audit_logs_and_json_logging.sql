-- Migration 024: audit_logs table + JSON logging support
-- Run on Supabase SQL Editor or via supabase db push
-- Date: 2026-04-06

-- ============================================================
-- audit_logs: tracks every critical mutation (finance, users, auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    action      TEXT        NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    meta        JSONB       NOT NULL DEFAULT '{}',
    request_id  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimise common queries: by user timeline and by entity
CREATE INDEX IF NOT EXISTS audit_logs_user_created
    ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity
    ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_logs_action
    ON audit_logs (action, created_at DESC);

-- ============================================================
-- RLS — only service-role can INSERT; admins/super_admins can SELECT
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS entirely (used by backend)
-- Regular users: admins can view all, others see nothing
CREATE POLICY "admins_can_read_audit_logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- No direct INSERT from client (service role only)
-- No UPDATE or DELETE allowed (immutable audit trail)

COMMENT ON TABLE audit_logs IS
    'Immutable audit trail for financial, user, and auth mutations. '
    'Written by the API service role only. '
    'Retention policy: keep for 2 years (configure pg_partman if needed).';
