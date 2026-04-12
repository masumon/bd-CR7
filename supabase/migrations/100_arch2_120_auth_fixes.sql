---
-- Architecture 2: Auth Fixes
-- File: 100_arch2_120_auth_fixes.sql
-- Purpose: Add viewer role, auto-create users profile on auth signup
--
-- ⚠️  IMPORTANT — Run in TWO separate steps in Supabase SQL Editor:
--     STEP 1 → Run only the PART 1 block, then click Run
--     STEP 2 → Run only the PART 2 block, then click Run
--   (PostgreSQL cannot use a newly added ENUM value in the same transaction)
---

-- ============================================================================
-- PART 1 — Run this block first, alone (then click Run / commit).
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';


-- ============================================================================
-- PART 2 — Run this block AFTER Part 1 has been committed.
-- ============================================================================

-- Auto-create public.users row when a new auth.users row is inserted.
-- Covers: email/password signup, Google OAuth, magic link (first login).

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  TEXT;
  v_role_name  TEXT;
  v_role       user_role;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  v_role_name := COALESCE(
    NEW.raw_user_meta_data->>'role_name',
    'viewer'
  );

  -- Cast to enum safely; fall back to viewer if unknown value supplied
  BEGIN
    v_role := v_role_name::user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'viewer'::user_role;
  END;

  INSERT INTO public.users (
    id, email, auth_email, full_name, role, is_active, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, NEW.email, v_full_name, v_role, true, NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_auth_user();

-- Back-fill: create users rows for existing auth users that have none.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO public.users (id, email, auth_email, full_name, role, is_active)
SELECT
  au.id,
  au.email,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  CASE
    WHEN au.raw_user_meta_data->>'role_name' IN (
      'super_admin','admin','checker','maker',
      'supervisor','engineer','mason','worker','viewer'
    ) THEN (au.raw_user_meta_data->>'role_name')::user_role
    ELSE 'viewer'::user_role
  END,
  true
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 4. RLS: allow a user to insert their OWN profile row (self-service fallback)
--    Required so the client-side auto-create in authStore can succeed when
--    the DB trigger didn't fire (e.g. existing accounts before migration).
-- ============================================================================

DROP POLICY IF EXISTS users_self_insert ON users;

CREATE POLICY users_self_insert ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

---
-- STATUS: ✅ Ready
-- Covers: viewer ENUM, auto-create trigger, back-fill, self-insert RLS policy
---
