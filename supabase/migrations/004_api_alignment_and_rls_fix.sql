-- 004_api_alignment_and_rls_fix.sql
-- Align API expectations with current schema and harden RLS for users/products/expenses.

BEGIN;

-- Guarantee expected columns for users table (role_id-based authorization model).
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS role_id INT REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'supabase_managed',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Keep existing rows valid even if created from old schema variants.
UPDATE users
SET full_name = COALESCE(full_name, email),
    password_hash = COALESCE(password_hash, 'supabase_managed')
WHERE full_name IS NULL OR password_hash IS NULL;

-- Ensure a safe default role for migrated users.
WITH viewer_role AS (
  SELECT id FROM roles WHERE name = 'viewer' LIMIT 1
)
UPDATE users u
SET role_id = vr.id
FROM viewer_role vr
WHERE u.role_id IS NULL;

-- Ensure all API tables have RLS enabled.
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;

-- Recreate policy set idempotently to avoid legacy policy conflicts.
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS products_read_policy ON products;
DROP POLICY IF EXISTS products_write_policy ON products;
DROP POLICY IF EXISTS expenses_maker_checker ON expenses;

CREATE POLICY users_select_policy ON users
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name IN ('admin', 'checker')
  )
);

CREATE POLICY users_update_policy ON users
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name = 'admin'
  )
)
WITH CHECK (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name = 'admin'
  )
);

CREATE POLICY users_insert_policy ON users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name = 'admin'
  )
);

CREATE POLICY products_read_policy ON products
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY products_write_policy ON products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name IN ('admin', 'maker')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name IN ('admin', 'maker')
  )
);

CREATE POLICY expenses_maker_checker ON expenses
FOR ALL TO authenticated
USING (
  maker_id = auth.uid()
  OR checker_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name IN ('admin', 'checker')
  )
)
WITH CHECK (
  maker_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users au
    JOIN roles ar ON ar.id = au.role_id
    WHERE au.id = auth.uid() AND ar.name IN ('admin', 'checker')
  )
);

COMMIT;
