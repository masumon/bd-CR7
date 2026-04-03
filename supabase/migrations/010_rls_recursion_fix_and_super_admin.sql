-- 010_rls_recursion_fix_and_super_admin.sql
-- Remove recursive users RLS patterns and harden role resolution.

BEGIN;

INSERT INTO public.roles (name, description)
VALUES ('super_admin', 'Highest privilege administrator')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = auth.uid()
    AND COALESCE(u.is_active, TRUE)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = ANY(role_names), FALSE);
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated;

DROP POLICY IF EXISTS user_isolation ON public.users;
DROP POLICY IF EXISTS users_self_or_admin ON public.users;
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_update_policy ON public.users;
DROP POLICY IF EXISTS users_insert_policy ON public.users;

CREATE POLICY users_read_self_or_privileged
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.has_any_role(ARRAY['super_admin', 'admin'])
);

CREATE POLICY users_update_self_or_privileged
ON public.users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR public.has_any_role(ARRAY['super_admin', 'admin'])
)
WITH CHECK (
  id = auth.uid()
  OR public.has_any_role(ARRAY['super_admin', 'admin'])
);

CREATE POLICY users_insert_privileged_only
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(ARRAY['super_admin', 'admin']));

CREATE POLICY users_delete_privileged_only
ON public.users
FOR DELETE
TO authenticated
USING (public.has_any_role(ARRAY['super_admin', 'admin']));

COMMIT;