-- Migration: Add encryption columns to messages table
-- Stores the IV and auth tag needed for AES-256-GCM decryption.
-- Existing plaintext messages will have NULL values (handled in application code).

ALTER TABLE messages ADD COLUMN IF NOT EXISTS encryption_iv VARCHAR(32);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS auth_tag VARCHAR(32);
