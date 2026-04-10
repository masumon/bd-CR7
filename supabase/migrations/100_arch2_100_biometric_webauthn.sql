-- Architecture 2: Biometric credentials and WebAuthn challenge tables
-- Safe to re-run: uses IF NOT EXISTS throughout

-- biometric_credentials: stores registered fingerprint/passkey credentials per user
CREATE TABLE IF NOT EXISTS public.biometric_credentials (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credential_id     TEXT        NOT NULL,
  public_key        TEXT        NOT NULL,
  device_name       TEXT        NOT NULL DEFAULT 'Primary Device',
  transports        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  sign_count        BIGINT      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, credential_id)
);

CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id
  ON public.biometric_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id
  ON public.biometric_credentials(credential_id);

-- webauthn_challenges: temporary challenge storage during authentication flow
-- One active challenge per user at a time (PRIMARY KEY on user_id)
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  user_id    UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  challenge  TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at
  ON public.webauthn_challenges(expires_at);

-- RLS: users can only access their own credentials
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'biometric_credentials' AND policyname = 'biometric_credentials_owner'
  ) THEN
    CREATE POLICY biometric_credentials_owner ON public.biometric_credentials
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webauthn_challenges' AND policyname = 'webauthn_challenges_owner'
  ) THEN
    CREATE POLICY webauthn_challenges_owner ON public.webauthn_challenges
      USING (user_id = auth.uid());
  END IF;
END $$;
