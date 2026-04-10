---
-- Architecture 2: Materials Module
-- File: 040_materials.sql
-- Purpose: Materials inventory, suppliers, tracking
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- TABLES
-- ============================================================================

-- Materials inventory
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name TEXT NOT NULL,
  category TEXT,
  unit TEXT,  -- kg, meter, pieces, etc.
  quantity NUMERIC(12, 2),
  unit_price NUMERIC(12, 2),
  total_value NUMERIC(15, 2),
  supplier_id UUID,  -- Will be set as FK to contractors in 080_contractor migration
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  purchase_date DATE,
  delivery_date DATE,
  purchase_order_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Material movement log (stock tracking)
CREATE TABLE IF NOT EXISTS material_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,  -- in, out, adjustment, damage
  quantity_moved NUMERIC(12, 2),
  reason TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_material_movements_material_id ON material_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_material_movements_created_at ON material_movements(created_at);

ALTER TABLE material_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER materials_updated_at_trigger
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Materials, inventory, suppliers tracking
-- Status: CLEAN (NO SEED DATA)
-- Note: contractors table referenced (created in 080_contractor.sql)
--
