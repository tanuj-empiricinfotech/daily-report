-- Migration: Relax refresh_tokens.token_hash constraints
-- After the auth refactor, sessions are identified by their primary key id
-- (carried inside the JWT). The token_hash column is no longer used for
-- lookups, but the legacy NOT NULL + UNIQUE constraints caused login to fail
-- with a unique-violation 500 error whenever a second session was created
-- (the service was inserting empty strings).

ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_token_hash_key;
ALTER TABLE refresh_tokens ALTER COLUMN token_hash DROP NOT NULL;
