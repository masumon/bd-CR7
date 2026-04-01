-- 005_transfer_sales_rls_alignment.sql
-- Additive RLS alignment for transfer and sales domain tables.

BEGIN;

ALTER TABLE IF EXISTS fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fund_transactions' AND policyname = 'fund_transactions_read_access'
  ) THEN
    CREATE POLICY fund_transactions_read_access
    ON fund_transactions FOR SELECT
    TO authenticated
    USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM fund_accounts fa
        WHERE (fa.id = fund_transactions.from_account_id OR fa.id = fund_transactions.to_account_id)
          AND fa.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('admin', 'checker')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fund_transactions' AND policyname = 'fund_transactions_insert_access'
  ) THEN
    CREATE POLICY fund_transactions_insert_access
    ON fund_transactions FOR INSERT
    TO authenticated
    WITH CHECK (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('admin', 'maker')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_access_policy'
  ) THEN
    CREATE POLICY customers_access_policy
    ON customers FOR ALL
    TO authenticated
    USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('admin', 'checker')
      )
    )
    WITH CHECK (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('admin', 'maker', 'checker')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sales' AND policyname = 'sales_access_policy'
  ) THEN
    CREATE POLICY sales_access_policy
    ON sales FOR ALL
    TO authenticated
    USING (
      cashier_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('admin', 'checker')
      )
    )
    WITH CHECK (
      cashier_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = auth.uid() AND r.name IN ('admin', 'maker')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sale_items' AND policyname = 'sale_items_access_policy'
  ) THEN
    CREATE POLICY sale_items_access_policy
    ON sale_items FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM sales s
        WHERE s.id = sale_items.sale_id
          AND (
            s.cashier_id = auth.uid()
            OR EXISTS (
              SELECT 1
              FROM users u
              JOIN roles r ON r.id = u.role_id
              WHERE u.id = auth.uid() AND r.name IN ('admin', 'checker')
            )
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM sales s
        WHERE s.id = sale_items.sale_id
          AND (
            s.cashier_id = auth.uid()
            OR EXISTS (
              SELECT 1
              FROM users u
              JOIN roles r ON r.id = u.role_id
              WHERE u.id = auth.uid() AND r.name IN ('admin', 'maker')
            )
          )
      )
    );
  END IF;
END $$;

COMMIT;
