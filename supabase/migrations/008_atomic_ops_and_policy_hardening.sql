CREATE OR REPLACE FUNCTION public.create_expense_atomic(
  p_account_id UUID,
  p_category_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_maker_id UUID,
  p_risk_level VARCHAR,
  p_risk_score INT
)
RETURNS TABLE (
  expense_id UUID,
  status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM fund_accounts WHERE id = p_account_id) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  INSERT INTO expenses (
    id, account_id, category_id, amount, description, status, maker_id, risk_level, risk_score
  ) VALUES (
    v_expense_id, p_account_id, p_category_id, p_amount, p_description, 'pending', p_maker_id, p_risk_level, p_risk_score
  );

  INSERT INTO approvals (
    id, entity_type, entity_id, status, maker_id
  ) VALUES (
    gen_random_uuid(), 'expense', v_expense_id, 'pending', p_maker_id
  );

  RETURN QUERY SELECT v_expense_id, 'pending'::VARCHAR;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_expense_atomic(
  p_expense_id UUID,
  p_decision VARCHAR,
  p_note TEXT,
  p_checker_id UUID,
  p_checker_role VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense RECORD;
  v_balance NUMERIC;
BEGIN
  IF p_checker_role NOT IN ('admin', 'checker') THEN
    RAISE EXCEPTION 'Insufficient role';
  END IF;

  SELECT id, amount, account_id, maker_id, status
  INTO v_expense
  FROM expenses
  WHERE id = p_expense_id
  FOR UPDATE;

  IF v_expense.id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;
  IF v_expense.status <> 'pending' THEN
    RAISE EXCEPTION 'Expense is already processed';
  END IF;
  IF v_expense.maker_id = p_checker_id THEN
    RAISE EXCEPTION 'Maker cannot approve own expense';
  END IF;

  IF p_decision = 'approved' THEN
    SELECT balance INTO v_balance FROM fund_accounts WHERE id = v_expense.account_id FOR UPDATE;
    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'Account not found';
    END IF;
    IF v_balance < v_expense.amount THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;

    UPDATE fund_accounts
    SET balance = balance - v_expense.amount,
        updated_at = NOW()
    WHERE id = v_expense.account_id;
  END IF;

  UPDATE expenses
  SET status = p_decision,
      checker_id = p_checker_id,
      approval_note = p_note,
      approved_at = NOW()
  WHERE id = p_expense_id;

  UPDATE approvals
  SET status = p_decision,
      checker_id = p_checker_id,
      checker_note = p_note,
      decided_at = NOW()
  WHERE entity_type = 'expense' AND entity_id = p_expense_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_atomic(
  p_customer_id UUID,
  p_cashier_id UUID,
  p_items JSONB
)
RETURNS TABLE (
  sale_id UUID,
  total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID := gen_random_uuid();
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_qty NUMERIC;
  v_line_total NUMERIC;
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one sale item is required';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::NUMERIC;
    SELECT id, stock_qty, sell_price
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
    IF v_product.stock_qty < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock';
    END IF;

    v_line_total := v_qty * v_product.sell_price;
    v_total := v_total + v_line_total;

    UPDATE products
    SET stock_qty = stock_qty - v_qty,
        updated_at = NOW()
    WHERE id = v_product.id;
  END LOOP;

  INSERT INTO sales (id, customer_id, cashier_id, total_amount)
  VALUES (v_sale_id, p_customer_id, p_cashier_id, v_total);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::NUMERIC;
    SELECT sell_price INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
    v_line_total := v_qty * v_product.sell_price;

    INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, line_total)
    VALUES (
      gen_random_uuid(),
      v_sale_id,
      (v_item->>'product_id')::UUID,
      v_qty,
      v_product.sell_price,
      v_line_total
    );
  END LOOP;

  RETURN QUERY SELECT v_sale_id, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.create_expense_atomic(UUID, UUID, NUMERIC, TEXT, UUID, VARCHAR, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_expense_atomic(UUID, UUID, NUMERIC, TEXT, UUID, VARCHAR, INT) TO service_role;

REVOKE ALL ON FUNCTION public.approve_expense_atomic(UUID, VARCHAR, TEXT, UUID, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_expense_atomic(UUID, VARCHAR, TEXT, UUID, VARCHAR) TO service_role;

REVOKE ALL ON FUNCTION public.create_sale_atomic(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sale_atomic(UUID, UUID, JSONB) TO service_role;

DROP POLICY IF EXISTS expenses_read_authenticated ON expenses;
DROP POLICY IF EXISTS ai_memory_authenticated ON ai_memory;

CREATE POLICY expenses_read_scoped ON expenses
FOR SELECT TO authenticated
USING (
  maker_id = auth.uid()
  OR checker_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = auth.uid() AND r.name IN ('admin', 'checker')
  )
);

CREATE POLICY ai_memory_owner_only ON ai_memory
FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());