-- Architecture 2: additive security settings for PIN + biometric login controls
-- Safe to re-run: uses IF NOT EXISTS and guarded ALTER statements

CREATE TABLE IF NOT EXISTS public.user_security_settings (
  user_id               UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  biometric_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  pin_enabled           BOOLEAN     NOT NULL DEFAULT FALSE,
  pin_hash              TEXT        NULL,
  pin_failed_attempts   INTEGER     NOT NULL DEFAULT 0,
  pin_locked_until      TIMESTAMPTZ NULL,
  trusted_device_hash   TEXT        NULL,
  trusted_device_label  TEXT        NULL,
  last_verified_at      TIMESTAMPTZ NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_security_settings_pin_locked_until
  ON public.user_security_settings(pin_locked_until);

ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_security_settings' AND policyname = 'user_security_settings_owner'
  ) THEN
    CREATE POLICY user_security_settings_owner ON public.user_security_settings
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE public.biometric_credentials
  ADD COLUMN IF NOT EXISTS device_binding_hash TEXT NULL,
  ADD COLUMN IF NOT EXISTS device_platform TEXT NULL,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_biometric_credentials_device_binding_hash
  ON public.biometric_credentials(device_binding_hash);