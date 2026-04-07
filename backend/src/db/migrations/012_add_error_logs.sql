-- Migration: Add error_logs table
-- Captures unexpected (500-level) errors along with the request that caused them
-- so we can debug production issues without relying solely on ephemeral server logs.

CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  status_code INTEGER NOT NULL DEFAULT 500,
  error_name VARCHAR(255),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  request_body JSONB,
  request_headers JSONB,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_path ON error_logs(path);
