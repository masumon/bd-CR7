-- Architecture 2: email OTP verification storage for code-based sign-in
-- Safe to re-run: uses IF NOT EXISTS and guarded policy creation

CREATE TABLE IF NOT EXISTS public.email_otp_verifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  otp_hash   TEXT        NOT NULL,
  salt       TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INTEGER     NOT NULL DEFAULT 0,
  verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otp_verifications_email
  ON public.email_otp_verifications(email);

CREATE INDEX IF NOT EXISTS idx_email_otp_verifications_expires_at
  ON public.email_otp_verifications(expires_at);

ALTER TABLE public.email_otp_verifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_otp_verifications' AND policyname = 'email_otp_verifications_owner'
  ) THEN
    CREATE POLICY email_otp_verifications_owner ON public.email_otp_verifications
      USING (FALSE)
      WITH CHECK (FALSE);
  END IF;
END $$;
