-- Additive migration: enable RLS on biometric_credentials so each user can
-- only access their own fingerprint/WebAuthn credentials.
-- Requires auth.uid() which is available once Supabase Auth is enabled.

ALTER TABLE IF EXISTS biometric_credentials ENABLE ROW LEVEL SECURITY;

-- Users may read their own credentials
CREATE POLICY IF NOT EXISTS "biometric_creds_select_own"
  ON biometric_credentials FOR SELECT
  USING (user_id = auth.uid());

-- Users may enrol new credentials for themselves
CREATE POLICY IF NOT EXISTS "biometric_creds_insert_own"
  ON biometric_credentials FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users may update (e.g. sign_count) their own credentials
CREATE POLICY IF NOT EXISTS "biometric_creds_update_own"
  ON biometric_credentials FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users may deactivate / delete their own credentials
CREATE POLICY IF NOT EXISTS "biometric_creds_delete_own"
  ON biometric_credentials FOR DELETE
  USING (user_id = auth.uid());
