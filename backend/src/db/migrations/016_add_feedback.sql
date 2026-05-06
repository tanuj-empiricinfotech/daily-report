CREATE TABLE IF NOT EXISTS feedback (
    id           SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_feedback CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_to_user_id   ON feedback(to_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_from_user_id ON feedback(from_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at   ON feedback(created_at DESC);
