-- 004_cascade_delete_and_partitioning_draft.sql
-- Add ON DELETE CASCADE to transaction tables and draft partitioning structure.

-- Drop existing foreign keys on fund_transactions and re-add with CASCADE.
ALTER TABLE fund_transactions
DROP CONSTRAINT IF EXISTS fund_transactions_from_account_id_fkey,
DROP CONSTRAINT IF EXISTS fund_transactions_to_account_id_fkey,
DROP CONSTRAINT IF EXISTS fund_transactions_created_by_fkey;

ALTER TABLE fund_transactions
ADD CONSTRAINT fund_transactions_from_account_id_fkey
  FOREIGN KEY (from_account_id) REFERENCES fund_accounts(id) ON DELETE CASCADE,
ADD CONSTRAINT fund_transactions_to_account_id_fkey
  FOREIGN KEY (to_account_id) REFERENCES fund_accounts(id) ON DELETE CASCADE,
ADD CONSTRAINT fund_transactions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add CASCADE to expenses FK (linked to fund_accounts).
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_account_id_fkey;

ALTER TABLE expenses
ADD CONSTRAINT expenses_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES fund_accounts(id) ON DELETE CASCADE;

-- Add CASCADE to approvals (linked to expenses via entity_id, not enforced by FK yet but good practice).
-- If you add explicit FK in future, use CASCADE.

-- Add CASCADE to sale_items (already exists but confirm).
-- sale_items already has ON DELETE CASCADE on sale_id; good.

-- Draft: Partitioning structure for future archival (not yet applied).
-- To enable partitioning, uncomment and apply after backup:
-- ALTER TABLE fund_transactions
-- PARTITION BY RANGE (YEAR(created_at)) (
--   PARTITION p_2024 VALUES FROM (2024) TO (2025),
--   PARTITION p_2025 VALUES FROM (2025) TO (2026),
--   PARTITION p_2026 VALUES FROM (2026) TO (2027),
--   PARTITION p_future VALUES FROM (2027) TO MAXVALUE
-- );
--
-- Similar for expenses table if needed.

-- Add indexes for faster queries on transaction lookup by date.
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
