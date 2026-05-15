-- Remove team chat feature tables
-- Order: dependents first (notifications → messages → conversations)
DROP TABLE IF EXISTS chat_notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
