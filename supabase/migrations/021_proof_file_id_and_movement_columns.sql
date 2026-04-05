-- 021_proof_file_id_and_movement_columns.sql
-- Additive column extensions for evidence enforcement.
-- Adds proof_file_id FK and missing operational columns.
-- NO DROP, NO ALTER of existing data.

-- ─── attendance: add proof_file_id for work-proof enforcement ─────────────────
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS proof_file_id UUID REFERENCES project_files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS work_description TEXT;

CREATE INDEX IF NOT EXISTS idx_attendance_proof_file ON attendance (proof_file_id);

-- ─── material_movements: add all columns MaterialTrackFeature uses ────────────
ALTER TABLE material_movements
  ADD COLUMN IF NOT EXISTS unit           VARCHAR(20)        NOT NULL DEFAULT 'Pcs',
  ADD COLUMN IF NOT EXISTS unit_price     NUMERIC(18,2)      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost     NUMERIC(18,2)      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier       VARCHAR(120),
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS proof_file_id  UUID REFERENCES project_files(id) ON DELETE SET NULL;

-- Also fix: material_movements.movement_type CHECK allows only 'in','out' — extend to 'adjust'
-- Cannot modify CHECK directly without recreation, so drop and re-add (pure constraint, no data change)
ALTER TABLE material_movements
  DROP CONSTRAINT IF EXISTS material_movements_movement_type_check;

ALTER TABLE material_movements
  ADD CONSTRAINT material_movements_movement_type_check
    CHECK (movement_type IN ('in', 'out', 'adjust'));

CREATE INDEX IF NOT EXISTS idx_mm_proof_file ON material_movements (proof_file_id);

-- ─── expenses: ensure metadata JSONB exists (already in schema, safe guard) ──
-- proof_file_id is stored inside metadata JSONB, no column needed.

-- ─── RLS policies (inherit from existing table policies) ─────────────────────
-- No new policies needed — existing "authenticated" policies on attendance and
-- material_movements cover the new columns automatically.
