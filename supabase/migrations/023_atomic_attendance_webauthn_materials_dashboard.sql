-- 023_atomic_attendance_webauthn_materials_dashboard.sql
-- Additive migration for attendance uniqueness, persistent WebAuthn challenges,
-- material stock-safe movement RPC, and single-call dashboard metrics RPC.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Enforce unique attendance per worker per date
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'attendance'
  ) THEN
    WITH ranked AS (
      SELECT
        ctid AS row_id,
        ROW_NUMBER() OVER (
          PARTITION BY worker_id, attendance_date
          ORDER BY COALESCE(updated_at, created_at, NOW()) DESC, id DESC
        ) AS rn
      FROM public.attendance
    )
    DELETE FROM public.attendance a
    USING ranked r
    WHERE a.ctid = r.row_id AND r.rn > 1;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_worker_date
      ON public.attendance(worker_id, attendance_date);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'attendance_worker_date_unique'
    ) THEN
      ALTER TABLE public.attendance
        ADD CONSTRAINT attendance_worker_date_unique
        UNIQUE USING INDEX uq_attendance_worker_date;
    END IF;
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 2) Persistent WebAuthn challenge store (multi-worker safe)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at
  ON public.webauthn_challenges(expires_at);

-- -----------------------------------------------------------------------------
-- 3) Material movement atomic RPC with stock validation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_material_movement_atomic(
  p_project_id UUID,
  p_material_name VARCHAR,
  p_quantity NUMERIC,
  p_unit VARCHAR,
  p_unit_price NUMERIC,
  p_supplier VARCHAR,
  p_notes TEXT,
  p_movement_type VARCHAR,
  p_proof_file_id UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (
  movement_id UUID,
  material_name VARCHAR,
  movement_type VARCHAR,
  quantity NUMERIC,
  resulting_stock NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_movement_id UUID := gen_random_uuid();
  v_stock_row public.materials_stock%ROWTYPE;
  v_effective_unit VARCHAR(20) := COALESCE(NULLIF(TRIM(p_unit), ''), 'Pcs');
  v_effective_unit_price NUMERIC := COALESCE(p_unit_price, 0);
  v_stock_after NUMERIC;
  v_qty NUMERIC;
BEGIN
  IF p_material_name IS NULL OR BTRIM(p_material_name) = '' THEN
    RAISE EXCEPTION 'Material name is required';
  END IF;

  IF p_movement_type NOT IN ('in', 'out', 'adjust') THEN
    RAISE EXCEPTION 'Invalid movement type';
  END IF;

  IF p_movement_type IN ('in', 'out') AND (p_quantity IS NULL OR p_quantity <= 0) THEN
    RAISE EXCEPTION 'Quantity must be greater than zero for in/out movement';
  END IF;

  IF p_movement_type = 'adjust' AND (p_quantity IS NULL OR p_quantity = 0) THEN
    RAISE EXCEPTION 'Quantity must be non-zero for adjust movement';
  END IF;

  v_qty := p_quantity;

  SELECT *
  INTO v_stock_row
  FROM public.materials_stock
  WHERE material_name = p_material_name
  FOR UPDATE;

  IF p_movement_type = 'in' THEN
    IF v_stock_row.id IS NULL THEN
      INSERT INTO public.materials_stock (material_name, current_qty, unit, low_stock_threshold, updated_at)
      VALUES (p_material_name, v_qty, v_effective_unit, 5, NOW())
      RETURNING * INTO v_stock_row;
    ELSE
      UPDATE public.materials_stock
      SET current_qty = current_qty + v_qty,
          unit = COALESCE(NULLIF(v_effective_unit, ''), unit),
          updated_at = NOW()
      WHERE id = v_stock_row.id
      RETURNING * INTO v_stock_row;
    END IF;
  ELSIF p_movement_type = 'out' THEN
    IF v_stock_row.id IS NULL THEN
      RAISE EXCEPTION 'No stock record found for material';
    END IF;

    IF v_stock_row.current_qty < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock balance';
    END IF;

    UPDATE public.materials_stock
    SET current_qty = current_qty - v_qty,
        updated_at = NOW()
    WHERE id = v_stock_row.id
    RETURNING * INTO v_stock_row;
  ELSE
    IF v_stock_row.id IS NULL THEN
      INSERT INTO public.materials_stock (material_name, current_qty, unit, low_stock_threshold, updated_at)
      VALUES (p_material_name, v_qty, v_effective_unit, 5, NOW())
      RETURNING * INTO v_stock_row;
    ELSE
      IF (v_stock_row.current_qty + v_qty) < 0 THEN
        RAISE EXCEPTION 'Adjust would make stock negative';
      END IF;

      UPDATE public.materials_stock
      SET current_qty = current_qty + v_qty,
          unit = COALESCE(NULLIF(v_effective_unit, ''), unit),
          updated_at = NOW()
      WHERE id = v_stock_row.id
      RETURNING * INTO v_stock_row;
    END IF;
  END IF;

  v_stock_after := COALESCE(v_stock_row.current_qty, 0);

  INSERT INTO public.material_movements (
    id,
    project_id,
    material_name,
    quantity,
    unit,
    unit_cost,
    unit_price,
    total_cost,
    supplier,
    notes,
    movement_type,
    proof_file_id,
    created_by,
    created_at
  ) VALUES (
    v_movement_id,
    p_project_id,
    p_material_name,
    v_qty,
    v_effective_unit,
    v_effective_unit_price,
    v_effective_unit_price,
    (v_qty * v_effective_unit_price),
    NULLIF(TRIM(COALESCE(p_supplier, '')), ''),
    NULLIF(TRIM(COALESCE(p_notes, '')), ''),
    p_movement_type,
    p_proof_file_id,
    p_actor_user_id,
    NOW()
  );

  RETURN QUERY
  SELECT v_movement_id, p_material_name, p_movement_type, v_qty, v_stock_after;
END;
$$;

REVOKE ALL ON FUNCTION public.record_material_movement_atomic(UUID, VARCHAR, NUMERIC, VARCHAR, NUMERIC, VARCHAR, TEXT, VARCHAR, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_material_movement_atomic(UUID, VARCHAR, NUMERIC, VARCHAR, NUMERIC, VARCHAR, TEXT, VARCHAR, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_material_movement_atomic(UUID, VARCHAR, NUMERIC, VARCHAR, NUMERIC, VARCHAR, TEXT, VARCHAR, UUID, UUID) TO service_role;

-- -----------------------------------------------------------------------------
-- 4) Single RPC for dashboard metrics
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_balance NUMERIC := 0;
  v_monthly_sales NUMERIC := 0;
  v_total_expenses NUMERIC := 0;
  v_pending_expenses BIGINT := 0;
  v_total_workers BIGINT := 0;
  v_total_projects BIGINT := 0;
  v_recent_expenses JSONB := '[]'::JSONB;
BEGIN
  SELECT COALESCE(SUM(balance), 0)
  INTO v_total_balance
  FROM public.fund_accounts;

  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_monthly_sales
  FROM public.sales
  WHERE created_at >= (NOW() - INTERVAL '30 days');

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_expenses
  FROM public.expenses;

  SELECT COUNT(*)
  INTO v_pending_expenses
  FROM public.expenses
  WHERE status = 'pending';

  SELECT COUNT(*)
  INTO v_total_workers
  FROM public.workers;

  SELECT COUNT(*)
  INTO v_total_projects
  FROM public.projects;

  SELECT COALESCE(
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', e.id,
        'amount', e.amount,
        'description', e.description,
        'status', e.status,
        'created_at', e.created_at
      )
      ORDER BY e.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_recent_expenses
  FROM (
    SELECT id, amount, description, status, created_at
    FROM public.expenses
    ORDER BY created_at DESC
    LIMIT 10
  ) e;

  RETURN JSONB_BUILD_OBJECT(
    'total_balance', v_total_balance,
    'fund_balance', v_total_balance,
    'monthly_sales', v_monthly_sales,
    'total_expenses', v_total_expenses,
    'pending_expenses', v_pending_expenses,
    'total_workers', v_total_workers,
    'total_projects', v_total_projects,
    'recent_expenses', v_recent_expenses
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dashboard_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_metrics() TO service_role;

COMMIT;
