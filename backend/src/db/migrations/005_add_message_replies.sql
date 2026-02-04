-- Migration: Add reply support to messages
-- Adds reply_to_message_id for threaded replies

-- Add reply column
ALTER TABLE messages
ADD COLUMN reply_to_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;

-- Add index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
