-- Migration: Change time columns from DECIMAL to VARCHAR to support HH:MM format
-- This migration converts actual_time_spent and tracked_time from DECIMAL(10,2) to VARCHAR(10)

DO $$
DECLARE
  actual_time_type TEXT;
  tracked_time_type TEXT;
  has_new_columns BOOLEAN;
BEGIN
  -- Get the data type of the columns
  SELECT data_type INTO actual_time_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'daily_logs' AND column_name = 'actual_time_spent';
  
  SELECT data_type INTO tracked_time_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'daily_logs' AND column_name = 'tracked_time';
  
  -- Check if temporary columns already exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_logs' AND column_name = 'actual_time_spent_new'
  ) INTO has_new_columns;
  
  -- Only proceed if columns are DECIMAL (numeric) type and conversion hasn't been done
  -- Skip if columns are already VARCHAR (migration already completed)
  IF (actual_time_type = 'numeric' OR actual_time_type = 'decimal') AND NOT has_new_columns THEN
    -- Step 1: Add new temporary columns with VARCHAR type
    ALTER TABLE daily_logs ADD COLUMN actual_time_spent_new VARCHAR(10);
    ALTER TABLE daily_logs ADD COLUMN tracked_time_new VARCHAR(10);

    -- Step 2: Convert existing decimal values to HH:MM format
    -- For example: 3.5 hours -> "3:30", 4.25 hours -> "4:15"
    UPDATE daily_logs SET
      actual_time_spent_new = CONCAT(
        FLOOR(actual_time_spent::NUMERIC)::TEXT,
        ':',
        LPAD(ROUND((actual_time_spent::NUMERIC - FLOOR(actual_time_spent::NUMERIC)) * 60)::TEXT, 2, '0')
      ),
      tracked_time_new = CONCAT(
        FLOOR(tracked_time::NUMERIC)::TEXT,
        ':',
        LPAD(ROUND((tracked_time::NUMERIC - FLOOR(tracked_time::NUMERIC)) * 60)::TEXT, 2, '0')
      );

    -- Step 3: Drop old columns
    ALTER TABLE daily_logs DROP COLUMN actual_time_spent;
    ALTER TABLE daily_logs DROP COLUMN tracked_time;

    -- Step 4: Rename new columns to original names
    ALTER TABLE daily_logs RENAME COLUMN actual_time_spent_new TO actual_time_spent;
    ALTER TABLE daily_logs RENAME COLUMN tracked_time_new TO tracked_time;
  ELSIF has_new_columns THEN
    -- Migration was partially completed, finish it
    ALTER TABLE daily_logs DROP COLUMN IF EXISTS actual_time_spent;
    ALTER TABLE daily_logs DROP COLUMN IF EXISTS tracked_time;
    ALTER TABLE daily_logs RENAME COLUMN actual_time_spent_new TO actual_time_spent;
    ALTER TABLE daily_logs RENAME COLUMN tracked_time_new TO tracked_time;
  END IF;
END $$;

-- Step 5: Add NOT NULL constraints (time can be "0:00" but not NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_logs' AND column_name = 'actual_time_spent'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE daily_logs ALTER COLUMN actual_time_spent SET NOT NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_logs' AND column_name = 'tracked_time'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE daily_logs ALTER COLUMN tracked_time SET NOT NULL;
  END IF;
END $$;

-- Step 6: Add CHECK constraints to ensure valid HH:MM format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'daily_logs' AND constraint_name = 'check_actual_time_format'
  ) THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_actual_time_format
      CHECK (actual_time_spent ~ '^\d+:[0-5]\d$');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'daily_logs' AND constraint_name = 'check_tracked_time_format'
  ) THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_tracked_time_format
      CHECK (tracked_time ~ '^\d+:[0-5]\d$');
  END IF;
END $$;

-- Note: The regex pattern '^\d+:[0-5]\d$' ensures:
-- - One or more digits for hours
-- - A colon separator
-- - Exactly two digits for minutes (00-59)
