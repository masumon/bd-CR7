---
-- Architecture 2: Phone OTP Verifications
-- File: 100_arch2_110_phone_otp.sql
-- Purpose: Custom phone OTP system (bypasses Supabase phone provider requirement)
-- Status: READY
---

-- ============================================================================
-- TABLE: phone_otp_verifications
-- Stores OTP codes (hashed) for phone-based authentication.
-- TTL: 10 minutes. Max 5 attempts per OTP.
-- ============================================================================

CREATE TABLE IF NOT EXISTS phone_otp_verifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT        NOT NULL,
  otp_hash     TEXT        NOT NULL,        -- SHA-256 hex of "OTP:phone:salt"
  salt         TEXT        NOT NULL,        -- random salt per OTP
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INT         NOT NULL DEFAULT 0,
  verified     BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_phone       ON phone_otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otp_expires_at  ON phone_otp_verifications(expires_at);

-- Only the service role (Python API) may read/write this table.
ALTER TABLE phone_otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY phone_otp_service_only ON phone_otp_verifications
  USING (false);   -- anon/user clients cannot access; only service_role bypasses RLS

-- ============================================================================
-- CLEANUP FUNCTION: remove expired OTPs (called by API on each send)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_phone_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_otp_verifications
  WHERE expires_at < NOW() OR verified = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---
-- STATUS: ✅ Ready
-- Contains: phone_otp_verifications table, cleanup function
---
