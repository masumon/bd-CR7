-- Migration 028: Ensure user_code uniqueness via a single case-insensitive partial index.
-- Migration 026 already created: CREATE UNIQUE INDEX uq_users_user_code ON users ((lower(user_code))) WHERE user_code IS NOT NULL;
-- That case-insensitive index is the correct approach. We must NOT add a second
-- case-sensitive UNIQUE constraint (it conflicts and causes INSERT failures).
-- This migration is intentionally a no-op — the index from 026 is sufficient.

-- If the case-sensitive constraint from a prior version of this file was applied,
-- drop it to avoid dual-constraint conflicts:
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_code_unique;
