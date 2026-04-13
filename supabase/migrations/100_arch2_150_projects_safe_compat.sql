---
-- Architecture 2: Safe Projects Compatibility Patch
-- File: 150_projects_safe_compat.sql
-- Purpose: Additive compatibility columns for current web app contract.
-- Status: SAFE / ADDITIVE ONLY (NO DROPS, NO RENAMES)
---

-- Add missing compatibility columns expected by web modules.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Backfill compatibility columns from canonical columns when possible.
UPDATE public.projects
SET
  name = COALESCE(NULLIF(name, ''), title),
  end_date = COALESCE(end_date, expected_end_date)
WHERE
  (name IS NULL OR name = '')
  OR end_date IS NULL;

-- Keep new records consistent even if only compatibility field is written.
CREATE OR REPLACE FUNCTION public.sync_projects_compat_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.name IS NULL OR NEW.name = '') AND NEW.title IS NOT NULL THEN
    NEW.name := NEW.title;
  END IF;

  IF NEW.title IS NULL AND NEW.name IS NOT NULL THEN
    NEW.title := NEW.name;
  END IF;

  IF NEW.end_date IS NULL AND NEW.expected_end_date IS NOT NULL THEN
    NEW.end_date := NEW.expected_end_date;
  END IF;

  IF NEW.expected_end_date IS NULL AND NEW.end_date IS NOT NULL THEN
    NEW.expected_end_date := NEW.end_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_sync_compat_columns_trigger ON public.projects;

CREATE TRIGGER projects_sync_compat_columns_trigger
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_projects_compat_columns();

-- Lightweight lookup indexes for app filters.
CREATE INDEX IF NOT EXISTS idx_projects_name ON public.projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON public.projects(phase);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON public.projects(end_date);

-- Refresh PostgREST schema cache.
NOTIFY pgrst, 'reload schema';

---
-- STATUS: ✅ Ready
-- Adds: projects.name/end_date/cover_photo_url/phase/created_by
-- Keeps: Existing columns untouched
---
