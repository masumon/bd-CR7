-- 006_transfer_atomic_rpc.sql
-- Atomic financial transfer RPC for Supabase HTTP-only backend.

BEGIN;

CREATE OR REPLACE FUNCTION public.transfer_funds_atomic(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC,
  p_reference VARCHAR,
  p_actor_user_id UUID,
  p_actor_role VARCHAR
)
RETURNS TABLE (
  transaction_id UUID,
  from_balance NUMERIC,
  to_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_account fund_accounts%ROWTYPE;
  target_account fund_accounts%ROWTYPE;
  created_transaction_id UUID := gen_random_uuid();
BEGIN
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Source and destination accounts must differ';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  SELECT * INTO source_account
  FROM fund_accounts
  WHERE id = p_from_account_id
  FOR UPDATE;

  SELECT * INTO target_account
  FROM fund_accounts
  WHERE id = p_to_account_id
  FOR UPDATE;

  IF source_account.id IS NULL OR target_account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF p_actor_role NOT IN ('admin', 'checker') AND source_account.owner_user_id IS DISTINCT FROM p_actor_user_id THEN
    RAISE EXCEPTION 'Insufficient role for source account';
  END IF;

  IF source_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE fund_accounts
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_from_account_id;

  UPDATE fund_accounts
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_to_account_id;

  INSERT INTO fund_transactions (id, from_account_id, to_account_id, amount, reference, created_by)
  VALUES (created_transaction_id, p_from_account_id, p_to_account_id, p_amount, p_reference, p_actor_user_id);

  RETURN QUERY
  SELECT created_transaction_id,
         (source_account.balance - p_amount) AS from_balance,
         (target_account.balance + p_amount) AS to_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_funds_atomic(UUID, UUID, NUMERIC, VARCHAR, UUID, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_funds_atomic(UUID, UUID, NUMERIC, VARCHAR, UUID, VARCHAR) TO service_role;

COMMIT;
