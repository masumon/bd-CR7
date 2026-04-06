-- 026_profile_media_and_sensitive_dual_approval.sql
-- Adds user profile media + public user code and metadata for dual-admin approvals.

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS user_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_user_code
  ON public.users ((lower(user_code)))
  WHERE user_code IS NOT NULL;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS required_approvals INTEGER NOT NULL DEFAULT 1;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS approval_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS first_approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS second_approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS operation TEXT NOT NULL DEFAULT 'review';

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS operation_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS sensitive BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS last_actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.pending_approvals
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pending_approvals_sensitive
  ON public.pending_approvals (sensitive, status, created_at DESC);