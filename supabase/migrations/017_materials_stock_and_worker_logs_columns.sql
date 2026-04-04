-- Migration 017: Add materials_stock table and extend worker_logs/material_logs columns
-- Additive only — no destructive changes

-- materials_stock: used by MaterialTrackFeature to track current stock levels
CREATE TABLE IF NOT EXISTS materials_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name VARCHAR(120) NOT NULL UNIQUE,
  current_qty NUMERIC(18,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  low_stock_threshold NUMERIC(18,2) NOT NULL DEFAULT 5,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- material_logs: used by MaterialsView for stock register display
-- Add columns that MaterialsView.tsx expects but may be missing
ALTER TABLE material_logs
  ADD COLUMN IF NOT EXISTS item_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS unit VARCHAR(20),
  ADD COLUMN IF NOT EXISTS movement_type VARCHAR(10) DEFAULT 'in',
  ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(120),
  ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC(18,2);

-- worker_logs: add columns that WorkforceView.tsx and WorkerLogsFeature expect
ALTER TABLE worker_logs
  ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(10) DEFAULT 'Present',
  ADD COLUMN IF NOT EXISTS daily_wage NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS work_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS unpaid_balance NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS work_description TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6);

-- Enable RLS on new table
ALTER TABLE materials_stock ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write materials_stock
CREATE POLICY IF NOT EXISTS "authenticated_materials_stock"
  ON materials_stock
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
