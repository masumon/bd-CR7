-- SAFE TRIGGER CLEANUP (NO ERROR EVEN IF TABLE MISSING)

DO $$
BEGIN

  -- expenses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
  END IF;

  -- fund_transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fund_transactions') THEN
    DROP TRIGGER IF EXISTS trg_audit_fund_transactions ON public.fund_transactions;
  END IF;

  -- worker_logs (SAFE: may not exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_logs') THEN
    DROP TRIGGER IF EXISTS trg_audit_worker_logs ON public.worker_logs;
  END IF;

  -- material_logs (SAFE: may not exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_logs') THEN
    DROP TRIGGER IF EXISTS trg_audit_material_logs ON public.material_logs;
  END IF;

  -- projects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    DROP TRIGGER IF EXISTS trg_audit_projects ON public.projects;
  END IF;

  -- approvals
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approvals') THEN
    DROP TRIGGER IF EXISTS trg_audit_approvals ON public.approvals;
  END IF;

END $$;

-- SAFE FUNCTION CLEANUP
DROP FUNCTION IF EXISTS public.fn_audit_log() CASCADE;
DROP FUNCTION IF EXISTS public.pf_audit_fn() CASCADE;
DROP FUNCTION IF EXISTS public.aai_audit_fn() CASCADE;

-- SAFE TRIGGERS (PROJECT FILES / AI INSERTIONS)

DO $$
BEGIN

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') THEN
    DROP TRIGGER IF EXISTS pf_audit_trigger ON public.project_files;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_auto_insertions') THEN
    DROP TRIGGER IF EXISTS aai_audit_trigger ON public.ai_auto_insertions;
  END IF;

END $$;