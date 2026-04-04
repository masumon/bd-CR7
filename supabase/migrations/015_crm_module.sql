-- =============================================
-- Migration 015: CRM Module
-- Adds crm_leads and crm_interactions tables.
-- The existing `customers` table is reused for
-- the customer list (defined in 003_full_saas_schema).
-- =============================================

-- CRM leads (potential customers / pipeline)
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  company      TEXT,
  source       TEXT,                          -- e.g. Referral, Walk-in, Facebook, Other
  stage        TEXT NOT NULL DEFAULT 'New'
                 CHECK (stage IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  estimated_value NUMERIC(15,2),
  notes        TEXT,
  assigned_to  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM interactions (notes, calls, meetings per customer or lead)
CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  type         TEXT NOT NULL DEFAULT 'Note'
                 CHECK (type IN ('Note', 'Call', 'Meeting', 'Email', 'Follow-up')),
  summary      TEXT NOT NULL,
  next_action  TEXT,
  interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage        ON public.crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_cust  ON public.crm_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_lead  ON public.crm_interactions(lead_id);

-- updated_at trigger for leads
DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.crm_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='crm_leads' AND policyname='crm_leads_all_auth') THEN
    CREATE POLICY crm_leads_all_auth ON public.crm_leads
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='crm_interactions' AND policyname='crm_interactions_all_auth') THEN
    CREATE POLICY crm_interactions_all_auth ON public.crm_interactions
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
