-- =============================================
-- Migration 016: Inventory Advanced Module
-- Adds warehouses and stock_adjustments tables.
-- The existing `products` table is reused for the
-- product catalog (defined in 003_full_saas_schema).
-- =============================================

-- Warehouses / storage locations
CREATE TABLE IF NOT EXISTS public.warehouses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  location     TEXT,
  manager      TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-warehouse product stock levels
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id  UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty           NUMERIC(18,2) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, product_id)
);

-- Stock adjustments / transfers
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id    UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  adjustment_type TEXT NOT NULL DEFAULT 'in'
                    CHECK (adjustment_type IN ('in', 'out', 'transfer', 'adjustment')),
  quantity        NUMERIC(18,2) NOT NULL,
  reference       TEXT,          -- e.g. PO number, reason
  notes           TEXT,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_product  ON public.warehouse_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_wh       ON public.warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_product        ON public.stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_date           ON public.stock_adjustments(adjustment_date DESC);

-- updated_at trigger for warehouse_stock
DROP TRIGGER IF EXISTS trg_warehouse_stock_updated_at ON public.warehouse_stock;
CREATE OR REPLACE FUNCTION public.set_warehouse_stock_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_warehouse_stock_updated_at
  BEFORE UPDATE ON public.warehouse_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_warehouse_stock_updated_at();

-- RLS
ALTER TABLE public.warehouses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='warehouses' AND policyname='warehouses_all_auth') THEN
    CREATE POLICY warehouses_all_auth ON public.warehouses
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='warehouse_stock' AND policyname='warehouse_stock_all_auth') THEN
    CREATE POLICY warehouse_stock_all_auth ON public.warehouse_stock
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_adjustments' AND policyname='stock_adjustments_all_auth') THEN
    CREATE POLICY stock_adjustments_all_auth ON public.stock_adjustments
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
