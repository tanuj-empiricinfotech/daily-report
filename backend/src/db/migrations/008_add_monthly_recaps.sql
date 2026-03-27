-- Migration: Add monthly_recaps table
-- Stores generated monthly recap slide data per user

CREATE TABLE IF NOT EXISTS monthly_recaps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    slides_data JSONB NOT NULL,
    last_viewed_slide INTEGER NOT NULL DEFAULT 0,
    is_partial BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, month, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_recaps_user_id ON monthly_recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_recaps_user_month_year ON monthly_recaps(user_id, month, year);

-- Auto-update updated_at on row modification
CREATE TRIGGER update_monthly_recaps_updated_at
    BEFORE UPDATE ON monthly_recaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
