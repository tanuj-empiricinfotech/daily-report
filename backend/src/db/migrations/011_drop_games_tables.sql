-- Migration: Drop games platform tables
-- The games feature has been discontinued.

DROP VIEW IF EXISTS team_game_leaderboard;
DROP TABLE IF EXISTS skribbl_words;
DROP TABLE IF EXISTS game_participants;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS game_types;
