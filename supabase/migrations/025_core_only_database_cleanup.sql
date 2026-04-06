-- =============================================
-- Migration 025: Core-Only Database Cleanup
-- Purpose:
--   Remove non-core database objects after module consolidation.
--
-- Keeps core modules intact:
--   auth, finance, construction/workforce/materials/evidence,
--   reports, ai, audit, contractor, settings, users, projects.
--
-- Removes non-core module data objects:
--   CRM, advanced inventory, and import/landed-cost objects.
-- =============================================

BEGIN;

-- POS atomic helper is no longer used by active API routes.
DROP FUNCTION IF EXISTS public.create_sale_atomic(UUID, UUID, JSONB);

-- Advanced inventory helper from migration 016.
DROP FUNCTION IF EXISTS public.set_warehouse_stock_updated_at();

-- CRM module tables (migration 015)
DROP TABLE IF EXISTS public.crm_interactions CASCADE;
DROP TABLE IF EXISTS public.crm_leads CASCADE;

-- Advanced inventory module tables (migration 016)
DROP TABLE IF EXISTS public.stock_adjustments CASCADE;
DROP TABLE IF EXISTS public.warehouse_stock CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;

-- Import module tables (from full schema)
DROP TABLE IF EXISTS public.landed_costs CASCADE;
DROP TABLE IF EXISTS public.lc_records CASCADE;

COMMIT;
