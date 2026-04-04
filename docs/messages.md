# Messaging

> Last updated: 2026-04-04

## Overview

The messaging feature provides private 1-to-1 conversations between team members. Messages are encrypted at rest using AES-256-GCM, delivered in real time via Server-Sent Events (SSE), and support vanishing mode, reply threading, typing indicators, and draft persistence. The frontend uses virtualized rendering (`@tanstack/react-virtual`) for efficient message display with infinite scroll pagination.

## How It Works

### Sending a Message

1. The user types in the composer `Textarea`. Each keystroke updates the Redux draft (`teamChatSlice.drafts[conversationId]`) and fires a debounced typing indicator.
2. On submit (Enter key or send button), the frontend generates a local ID (`local-{timestamp}-{random}`) and optimistically adds the message to the Redux store with a `pending` status.
3. The API call `POST /api/team-chat/conversations/:id/messages` sends the content (and optional `reply_to_message_id`).
4. The backend validates the content (non-empty, max length), verifies the sender is a participant, encrypts the content with AES-256-GCM, stores it, and creates a notification for the recipient.
5. The SSE connection manager broadcasts a `new_message` event to the other participant. The sender's own client already has the optimistic message.

### Receiving a Message

1. The `useTeamChatSSE` hook maintains a persistent EventSource connection to `GET /api/team-chat/events`.
2. On a `new_message` event, the hook dispatches the message to Redux and increments the unread count if the conversation is not currently active.
3. If the conversation does not yet exist in the Redux store (first message from a new contact), the hook fetches the conversation metadata before adding the message.
4. A browser notification is shown if the conversation is not active and notifications are not muted.

### AES-256-GCM Encryption at Rest

All message content is encrypted before being stored in the database.

- **Algorithm**: `aes-256-gcm`
- **Key**: 256-bit key from the `MESSAGE_ENCRYPTION_KEY` environment variable (64 hex characters)
- **IV**: A unique 16-byte random initialization vector is generated per message
- **Auth tag**: 16-byte GCM authentication tag for tamper detection
- **Storage format**: The database stores `encrypted_content` (base64), `iv` (hex), and `auth_tag` (hex) as separate columns
- **Decryption**: Happens at read time in the repository layer before returning messages to the API

### Vanishing Messages

Either participant can toggle vanishing mode on a conversation via `PUT /api/team-chat/conversations/:id/vanishing`. When enabled:

- New messages get an `expires_at` timestamp set to `now + vanishing_duration_hours` (configurable, 1-168 hours).
- A background cleanup job (`cleanupExpiredMessages`) periodically deletes messages past their expiry.
- The UI shows a ghost icon on vanishing messages and an amber indicator in both the thread header and conversation list.
- A `vanishing_mode_changed` SSE event notifies both participants in real time.

### Typing Indicators

Typing indicators use a debounced send-and-timeout pattern:

1. On the first keystroke, the frontend sends `POST /api/team-chat/conversations/:id/typing` with `is_typing: true`.
2. A `TYPING_STOP_TIMEOUT_MS` (2s) timer resets on each keystroke. When it fires, `is_typing: false` is sent.
3. The backend broadcasts a `typing` SSE event to the other participant (excluding the sender).
4. The receiving client auto-expires stale typing indicators after `TYPING_INDICATOR_EXPIRY_MS` (4s), checked every `TYPING_CHECK_INTERVAL_MS` (2s).
5. Typing state is cleaned up on component unmount or conversation change.

### Reply-to Messages

Users can reply to any non-pending message. On desktop, hovering over a message reveals a reply button. On mobile, a long press (500ms) triggers the reply action. The reply preview appears above the composer, showing the original sender name and a truncated content preview. Clicking a reply preview inside a message bubble scrolls to and briefly highlights the referenced message.

### Draft Persistence

Message drafts are stored in Redux state (`teamChatSlice.drafts`) keyed by conversation ID. The `storage.service` provides `getChatDrafts()` and `saveChatDrafts()` to persist drafts to localStorage under the key `team-chat-drafts`. Drafts survive page reloads and tab switches.

### Conversation Filtering

The `ConversationList` component filters conversations by the other participant's name using a local search input. The backend only returns conversations where the current user is a participant.

### New Conversation Flow

The `NewConversationDialog` allows selecting a team member to start a conversation with. The `POST /api/team-chat/conversations` endpoint either creates a new conversation or returns an existing one if the pair already has a conversation.

## Architecture

```
Frontend                                    Backend
--------                                    -------
MessagesPage.tsx                            routes/team-chat.ts
  +-- ConversationList.tsx                  controllers/team-chat.controller.ts
  +-- MessageThread.tsx                     services/messages.service.ts
  +-- NewConversationDialog.tsx             services/sse-connection.service.ts
                                            db/repositories/messages.repository.ts
useTeamChatSSE.ts (SSE hook)               db/repositories/conversations.repository.ts
teamChatSlice.ts (Redux)                   utils/encryption.ts
storage.service.ts (localStorage)
```

### SSE Connection Management

The backend uses a singleton `SSEConnectionManager` that:

- Tracks active connections per user (supports multiple tabs/devices)
- Sends heartbeats at a configurable interval (`SSE_HEARTBEAT_INTERVAL_MS`) to keep connections alive
- Cleans up stale connections that exceed `SSE_CONNECTION_TIMEOUT_MS`
- Provides helper functions for broadcasting events: `sendNewMessageEvent`, `sendMessageReadEvent`, `sendVanishingModeChangedEvent`, `sendTypingEvent`

The frontend hook implements exponential backoff reconnection (1s, 2s, 5s, 10s, 30s) up to 10 attempts. On reconnection error, it proactively refreshes the access token before retrying.

### Mobile Layout

The page uses a responsive layout that toggles between the conversation list and the message thread:

- **Desktop** (`md:` breakpoint and above): Side-by-side layout with a fixed-width (320px) conversation list sidebar and a flexible message thread.
- **Mobile**: Only one panel is visible at a time. When no conversation is selected, the conversation list is shown. When a conversation is active, the thread is shown with a back button that clears the active conversation and returns to the list.

### Long-Press Reply on Mobile

Mobile users trigger the reply action via a long press (500ms hold). The `MessageBubble` component uses `onTouchStart`/`onTouchEnd`/`onTouchMove` handlers. Moving cancels the long press. The reply button appears briefly and is dismissed when tapping elsewhere.

## API Endpoints

All endpoints are prefixed with `/api/team-chat` and require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/conversations` | List conversations for the current user |
| `POST` | `/conversations` | Create or get a conversation (`participant_id` in body) |
| `GET` | `/conversations/:id` | Get a single conversation |
| `GET` | `/conversations/:id/messages` | Get messages with cursor pagination (`limit`, `before` query params) |
| `POST` | `/conversations/:id/messages` | Send a message (`content`, optional `reply_to_message_id`) |
| `DELETE` | `/messages/:id` | Delete a message (sender only) |
| `PUT` | `/conversations/:id/vanishing` | Toggle vanishing mode (`vanishing_mode`, optional `vanishing_duration_hours`) |
| `POST` | `/conversations/:id/read` | Mark messages as read (`up_to_message_id`) |
| `POST` | `/conversations/:id/typing` | Send typing indicator (`is_typing`) |
| `GET` | `/notifications/unread` | Get unread notification count |
| `GET` | `/events` | SSE endpoint for real-time events |

### SSE Event Types

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | Connection confirmation | Sent on initial connection |
| `new_message` | `{ conversation_id, message }` | New message in a conversation |
| `message_read` | `{ conversation_id, reader_id, read_up_to_message_id }` | Messages marked as read |
| `vanishing_mode_changed` | `{ conversation_id, vanishing_mode, vanishing_duration_hours, changed_by_id }` | Vanishing mode toggled |
| `typing` | `{ conversation_id, user_id, user_name, is_typing }` | Typing indicator |

## iOS Considerations

- The SSE `EventSource` API cannot set custom headers. To authenticate SSE connections on iOS Safari (where cookies may be blocked), the access token is appended as a `?token=` query parameter.
- The backend auth middleware checks for tokens in three places in order: cookie, `Authorization` header, query parameter.

## Extensibility

- **New SSE event types**: Add a new event type to the `SSEEventType` union, create a helper function in `sse-connection.service.ts`, and add a listener in the `useTeamChatSSE` hook.
- **New message types**: The message content is a plaintext string. Extending to support attachments or rich content would involve adding fields to the message schema and updating the encryption/decryption layer.
- **Group conversations**: The current architecture uses `participant_one_id` and `participant_two_id` columns. Group support would require a junction table for participants and updates to the SSE broadcast logic.

## Key Files

- `/frontend/src/pages/MessagesPage.tsx` -- Page layout and routing
- `/frontend/src/components/team-chat/MessageThread.tsx` -- Message display, composer, reply, typing
- `/frontend/src/components/team-chat/ConversationList.tsx` -- Sidebar conversation list with search
- `/frontend/src/lib/hooks/useTeamChatSSE.ts` -- SSE connection hook with reconnection
- `/frontend/src/lib/storage.service.ts` -- localStorage wrapper for drafts
- `/backend/src/routes/team-chat.ts` -- API route definitions
- `/backend/src/services/messages.service.ts` -- Message business logic
- `/backend/src/services/sse-connection.service.ts` -- SSE connection manager (singleton)
- `/backend/src/utils/encryption.ts` -- AES-256-GCM encrypt/decrypt utilities
