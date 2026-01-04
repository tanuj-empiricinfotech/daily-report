-- Add webhook_url column to teams table for Microsoft Teams integration
ALTER TABLE teams ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(2048) NULL;

-- Create index for better query performance when filtering teams with webhook URLs
CREATE INDEX IF NOT EXISTS idx_teams_webhook_url ON teams(webhook_url) WHERE webhook_url IS NOT NULL;
