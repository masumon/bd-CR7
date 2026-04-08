-- Migration 029: Drop broken audit trigger functions from migrations 013, 019, 020.
--
-- Root cause: those migrations inserted into audit_logs using columns
-- (action_type, table_name, actor_name, old_values, new_values, record_id,
--  changed_by, new_data, old_data) that do not exist in the current schema.
-- The current audit_logs schema (migration 024) uses:
--   (user_id, action, entity_type, entity_id, meta, request_id, created_at)
-- Audit trail is maintained by the API-layer audit_log() function instead.
--
-- These triggers cause runtime errors like:
--   "column action_type of relation audit_logs does not exist"
-- whenever writes occur on the affected tables.

-- ── Drop triggers from migration 013 (fn_audit_log) ─────────────────────────
DROP TRIGGER IF EXISTS trg_audit_expenses          ON public.expenses;
DROP TRIGGER IF EXISTS trg_audit_fund_transactions ON public.fund_transactions;
DROP TRIGGER IF EXISTS trg_audit_worker_logs       ON public.worker_logs;
DROP TRIGGER IF EXISTS trg_audit_material_logs     ON public.material_logs;
DROP TRIGGER IF EXISTS trg_audit_projects          ON public.projects;
DROP TRIGGER IF EXISTS trg_audit_approvals         ON public.approvals;

DROP FUNCTION IF EXISTS public.fn_audit_log() CASCADE;

-- ── Drop trigger from migration 019 (pf_audit_fn on project_files) ──────────
DROP TRIGGER IF EXISTS pf_audit_trigger ON public.project_files;
DROP FUNCTION IF EXISTS public.pf_audit_fn() CASCADE;

-- ── Drop trigger from migration 020 (aai_audit_fn on ai_auto_insertions) ────
DROP TRIGGER IF EXISTS aai_audit_trigger ON public.ai_auto_insertions;
DROP FUNCTION IF EXISTS public.aai_audit_fn() CASCADE;
