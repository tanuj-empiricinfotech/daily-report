-- Migration: Add estimated hours and progress tracking toggle to projects
-- Allows admins to set an estimated hour budget per project and opt-in to a
-- progress bar that fills as developers log tracked time against it.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS progress_tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND constraint_name = 'check_estimated_hours_non_negative'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT check_estimated_hours_non_negative
      CHECK (estimated_hours IS NULL OR estimated_hours >= 0);
  END IF;
END $$;
