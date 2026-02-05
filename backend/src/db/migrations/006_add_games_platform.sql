-- Migration: Add Games Platform Tables
-- Description: Creates tables for the modular mini-games platform

-- ============================================================================
-- CORE TABLES (shared by all games)
-- ============================================================================

-- Game types registry (mirrors backend registry)
CREATE TABLE IF NOT EXISTS game_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game sessions (all games)
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    game_type_id VARCHAR(50) NOT NULL REFERENCES game_types(id),
    room_code VARCHAR(10) NOT NULL,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    host_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'finished', 'abandoned')),
    settings JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game participants (all games)
CREATE TABLE IF NOT EXISTS game_participants (
    id SERIAL PRIMARY KEY,
    game_session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    final_score INTEGER DEFAULT 0,
    final_rank INTEGER,
    stats JSONB DEFAULT '{}',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    UNIQUE(game_session_id, user_id)
);

-- ============================================================================
-- SKRIBBL GAME TABLES
-- ============================================================================

-- Skribbl: Word bank
CREATE TABLE IF NOT EXISTS skribbl_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: same word can exist for global (null team_id) and per-team
CREATE UNIQUE INDEX IF NOT EXISTS idx_skribbl_words_unique
    ON skribbl_words(word, COALESCE(team_id, 0));

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_game_sessions_team_id ON game_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_code ON game_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_session_id ON game_participants(game_session_id);
CREATE INDEX IF NOT EXISTS idx_skribbl_words_difficulty ON skribbl_words(difficulty);
CREATE INDEX IF NOT EXISTS idx_skribbl_words_team_id ON skribbl_words(team_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Team game leaderboard view
CREATE OR REPLACE VIEW team_game_leaderboard AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    t.id AS team_id,
    gt.id AS game_type_id,
    gt.name AS game_name,
    COUNT(DISTINCT gp.game_session_id) AS games_played,
    COALESCE(SUM(gp.final_score), 0) AS total_score,
    COUNT(CASE WHEN gp.final_rank = 1 THEN 1 END) AS wins,
    ROUND(COALESCE(AVG(gp.final_score), 0)::numeric, 1) AS avg_score
FROM users u
JOIN team_members tm ON u.id = tm.user_id
JOIN teams t ON tm.team_id = t.id
LEFT JOIN game_participants gp ON u.id = gp.user_id
LEFT JOIN game_sessions gs ON gp.game_session_id = gs.id AND gs.team_id = t.id
LEFT JOIN game_types gt ON gs.game_type_id = gt.id
WHERE gs.status = 'finished' OR gs.id IS NULL
GROUP BY u.id, u.name, t.id, gt.id, gt.name;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Register game types
INSERT INTO game_types (id, name, description, min_players, max_players) VALUES
    ('skribbl', 'Skribbl', 'Draw and guess words with your team! One player draws while others try to guess the word.', 2, 8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    min_players = EXCLUDED.min_players,
    max_players = EXCLUDED.max_players,
    updated_at = CURRENT_TIMESTAMP;

-- Seed initial Skribbl words
INSERT INTO skribbl_words (word, category, difficulty) VALUES
    -- Easy Animals
    ('cat', 'animals', 'easy'),
    ('dog', 'animals', 'easy'),
    ('fish', 'animals', 'easy'),
    ('bird', 'animals', 'easy'),
    ('cow', 'animals', 'easy'),
    ('pig', 'animals', 'easy'),
    ('duck', 'animals', 'easy'),
    ('bee', 'animals', 'easy'),
    ('ant', 'animals', 'easy'),
    ('frog', 'animals', 'easy'),

    -- Easy Objects
    ('house', 'objects', 'easy'),
    ('car', 'objects', 'easy'),
    ('tree', 'objects', 'easy'),
    ('sun', 'objects', 'easy'),
    ('moon', 'objects', 'easy'),
    ('book', 'objects', 'easy'),
    ('phone', 'objects', 'easy'),
    ('chair', 'objects', 'easy'),
    ('table', 'objects', 'easy'),
    ('door', 'objects', 'easy'),
    ('bed', 'objects', 'easy'),
    ('lamp', 'objects', 'easy'),
    ('cup', 'objects', 'easy'),
    ('hat', 'objects', 'easy'),
    ('ball', 'objects', 'easy'),

    -- Easy Food
    ('apple', 'food', 'easy'),
    ('banana', 'food', 'easy'),
    ('pizza', 'food', 'easy'),
    ('cake', 'food', 'easy'),
    ('egg', 'food', 'easy'),
    ('bread', 'food', 'easy'),
    ('milk', 'food', 'easy'),
    ('ice cream', 'food', 'easy'),

    -- Medium Animals
    ('elephant', 'animals', 'medium'),
    ('giraffe', 'animals', 'medium'),
    ('penguin', 'animals', 'medium'),
    ('octopus', 'animals', 'medium'),
    ('butterfly', 'animals', 'medium'),
    ('dolphin', 'animals', 'medium'),
    ('kangaroo', 'animals', 'medium'),
    ('zebra', 'animals', 'medium'),
    ('monkey', 'animals', 'medium'),
    ('turtle', 'animals', 'medium'),

    -- Medium Objects
    ('computer', 'objects', 'medium'),
    ('umbrella', 'objects', 'medium'),
    ('bicycle', 'objects', 'medium'),
    ('camera', 'objects', 'medium'),
    ('guitar', 'objects', 'medium'),
    ('telescope', 'objects', 'medium'),
    ('helicopter', 'objects', 'medium'),
    ('lighthouse', 'objects', 'medium'),
    ('waterfall', 'objects', 'medium'),
    ('rainbow', 'objects', 'medium'),
    ('volcano', 'objects', 'medium'),
    ('keyboard', 'objects', 'medium'),

    -- Medium Food
    ('hamburger', 'food', 'medium'),
    ('spaghetti', 'food', 'medium'),
    ('sandwich', 'food', 'medium'),
    ('popcorn', 'food', 'medium'),
    ('chocolate', 'food', 'medium'),
    ('pancake', 'food', 'medium'),

    -- Medium Actions
    ('dancing', 'actions', 'medium'),
    ('swimming', 'actions', 'medium'),
    ('cooking', 'actions', 'medium'),
    ('painting', 'actions', 'medium'),
    ('climbing', 'actions', 'medium'),
    ('sleeping', 'actions', 'medium'),

    -- Hard Animals
    ('platypus', 'animals', 'hard'),
    ('chameleon', 'animals', 'hard'),
    ('armadillo', 'animals', 'hard'),
    ('porcupine', 'animals', 'hard'),
    ('salamander', 'animals', 'hard'),

    -- Hard Objects
    ('chandelier', 'objects', 'hard'),
    ('escalator', 'objects', 'hard'),
    ('microscope', 'objects', 'hard'),
    ('metronome', 'objects', 'hard'),
    ('kaleidoscope', 'objects', 'hard'),

    -- Hard Concepts
    ('astronaut', 'concepts', 'hard'),
    ('democracy', 'concepts', 'hard'),
    ('nightmare', 'concepts', 'hard'),
    ('celebration', 'concepts', 'hard'),
    ('meditation', 'concepts', 'hard'),

    -- Places
    ('beach', 'places', 'easy'),
    ('school', 'places', 'easy'),
    ('hospital', 'places', 'medium'),
    ('airport', 'places', 'medium'),
    ('library', 'places', 'medium'),
    ('stadium', 'places', 'medium'),
    ('pyramid', 'places', 'hard'),
    ('colosseum', 'places', 'hard')

ON CONFLICT DO NOTHING;
