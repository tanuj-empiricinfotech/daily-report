-- Migration: Change time columns from DECIMAL to VARCHAR to support HH:MM format
-- This migration converts actual_time_spent and tracked_time from DECIMAL(10,2) to VARCHAR(10)

-- Step 1: Add new temporary columns with VARCHAR type
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS actual_time_spent_new VARCHAR(10);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS tracked_time_new VARCHAR(10);

-- Step 2: Convert existing decimal values to HH:MM format
-- For example: 3.5 hours -> "3:30", 4.25 hours -> "4:15"
UPDATE daily_logs SET
  actual_time_spent_new = CONCAT(
    FLOOR(actual_time_spent)::TEXT,
    ':',
    LPAD(ROUND((actual_time_spent - FLOOR(actual_time_spent)) * 60)::TEXT, 2, '0')
  ),
  tracked_time_new = CONCAT(
    FLOOR(tracked_time)::TEXT,
    ':',
    LPAD(ROUND((tracked_time - FLOOR(tracked_time)) * 60)::TEXT, 2, '0')
  );

-- Step 3: Drop old columns
ALTER TABLE daily_logs DROP COLUMN actual_time_spent;
ALTER TABLE daily_logs DROP COLUMN tracked_time;

-- Step 4: Rename new columns to original names
ALTER TABLE daily_logs RENAME COLUMN actual_time_spent_new TO actual_time_spent;
ALTER TABLE daily_logs RENAME COLUMN tracked_time_new TO tracked_time;

-- Step 5: Add NOT NULL constraints (time can be "0:00" but not NULL)
ALTER TABLE daily_logs ALTER COLUMN actual_time_spent SET NOT NULL;
ALTER TABLE daily_logs ALTER COLUMN tracked_time SET NOT NULL;

-- Step 6: Add CHECK constraints to ensure valid HH:MM format
ALTER TABLE daily_logs ADD CONSTRAINT check_actual_time_format
  CHECK (actual_time_spent ~ '^\d+:[0-5]\d$');

ALTER TABLE daily_logs ADD CONSTRAINT check_tracked_time_format
  CHECK (tracked_time ~ '^\d+:[0-5]\d$');

-- Note: The regex pattern '^\d+:[0-5]\d$' ensures:
-- - One or more digits for hours
-- - A colon separator
-- - Exactly two digits for minutes (00-59)
