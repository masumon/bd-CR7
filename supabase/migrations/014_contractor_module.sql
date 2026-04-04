-- =============================================
-- Migration 014: Contractor Module
-- Adds contractors, contractor_contracts, and
-- contractor_payments tables for full CRUD.
-- =============================================

-- Contractors master table
CREATE TABLE IF NOT EXISTS public.contractors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  company         TEXT,
  nid             TEXT,
  specialization  TEXT,
  status          TEXT NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contractor contracts
CREATE TABLE IF NOT EXISTS public.contractor_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id    UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  project_name     TEXT NOT NULL,
  contract_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  start_date       DATE,
  end_date         DATE,
  status           TEXT NOT NULL DEFAULT 'Active'
                     CHECK (status IN ('Active', 'Completed', 'Terminated', 'On Hold')),
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contractor payments
CREATE TABLE IF NOT EXISTS public.contractor_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  contract_id   UUID REFERENCES public.contractor_contracts(id) ON DELETE SET NULL,
  amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  method        TEXT NOT NULL DEFAULT 'Cash'
                  CHECK (method IN ('Cash', 'Bank Transfer', 'Cheque', 'bKash', 'Nagad', 'Other')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contractor_contracts_contractor ON public.contractor_contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_contractor ON public.contractor_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_contract  ON public.contractor_payments(contract_id);

-- Auto-update updated_at trigger (reuse or create)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contractors_updated_at ON public.contractors;
CREATE TRIGGER trg_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contractor_contracts_updated_at ON public.contractor_contracts;
CREATE TRIGGER trg_contractor_contracts_updated_at
  BEFORE UPDATE ON public.contractor_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: enable but allow all authenticated users (same pattern as other tables)
ALTER TABLE public.contractors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_payments  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- contractors
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contractors' AND policyname='contractors_all_auth') THEN
    CREATE POLICY contractors_all_auth ON public.contractors
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- contractor_contracts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contractor_contracts' AND policyname='contractor_contracts_all_auth') THEN
    CREATE POLICY contractor_contracts_all_auth ON public.contractor_contracts
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- contractor_payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contractor_payments' AND policyname='contractor_payments_all_auth') THEN
    CREATE POLICY contractor_payments_all_auth ON public.contractor_payments
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
