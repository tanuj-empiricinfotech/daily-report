-- Team Chat Feature Migration
-- Adds support for 1-to-1 messaging with vanishing mode

-- Create conversations table
-- Stores 1-to-1 chat sessions between team members
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    participant_one_id INTEGER NOT NULL,
    participant_two_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    vanishing_mode BOOLEAN DEFAULT FALSE,
    vanishing_duration_hours INTEGER DEFAULT 24,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_one_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_two_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    -- Ensure consistent ordering: participant_one_id < participant_two_id
    -- This prevents duplicate conversations between same users
    CONSTRAINT unique_conversation UNIQUE(participant_one_id, participant_two_id),
    CONSTRAINT ordered_participants CHECK (participant_one_id < participant_two_id)
);

-- Create messages table
-- Stores individual chat messages with optional vanishing support
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_vanishing BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create chat_notifications table
-- Tracks unread message state per user for notification badges
CREATE TABLE IF NOT EXISTS chat_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    conversation_id INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    UNIQUE(user_id, message_id)
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team_id ON conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at DESC);
-- Partial index for efficient vanishing message cleanup
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_id ON chat_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_conversation ON chat_notifications(conversation_id);
-- Partial index for unread notifications lookup
CREATE INDEX IF NOT EXISTS idx_chat_notifications_unread ON chat_notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
