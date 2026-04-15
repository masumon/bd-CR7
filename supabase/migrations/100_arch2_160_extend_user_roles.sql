---
-- Architecture 2: Extend User Roles
-- File: 100_arch2_160_extend_user_roles.sql
-- Purpose: Add manager and accountant roles to the user_role enum
--          and keep auth-user auto provisioning aligned with app RBAC.
--
-- ⚠️ IMPORTANT — Run in TWO separate steps in Supabase SQL Editor if needed:
--    STEP 1 → Run only the PART 1 block and commit
--    STEP 2 → Run the PART 2 block after PART 1 is committed
--
-- PostgreSQL cannot reliably use newly added enum values inside the same
-- transaction where they were introduced.
---

-- ============================================================================
-- PART 1 — Extend enum values first.
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accountant';


-- ============================================================================
-- PART 2 — Recreate auth signup trigger logic after PART 1 commits.
-- ============================================================================

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
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    auth_email = EXCLUDED.auth_email,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    role = COALESCE(public.users.role, EXCLUDED.role),
    is_active = COALESCE(public.users.is_active, EXCLUDED.is_active),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

INSERT INTO public.users (id, email, auth_email, full_name, role, is_active)
SELECT
  au.id,
  au.email,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  CASE
    WHEN au.raw_user_meta_data->>'role_name' IN (
      'super_admin','admin','manager','accountant','checker','maker',
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

---
-- STATUS: ✅ Ready
-- Covers: manager/accountant enum values and aligned auth-user provisioning
---