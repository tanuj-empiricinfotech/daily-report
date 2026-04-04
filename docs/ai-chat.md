# AI Chat

> Last updated: 2026-04-04

## Overview

The AI Chat feature lets users have a conversational interface over their daily work logs. The AI assistant can summarize work, analyze productivity patterns, generate status reports, and answer questions -- all grounded in the user's actual log data for a selected date range. Admins can chat about any team member's logs.

## How It Works

1. The user opens the **Chat with Logs** page and selects a date range (defaults to the last 7 days).
2. Admins can optionally select a team member whose logs to discuss.
3. The frontend fetches context metadata (log count, user name, period) via `GET /api/chat/context` and displays it in a sidebar card.
4. When the user sends a message, the `ChatThread` component posts to `POST /api/chat` with the message history and context options.
5. The backend's `ChatService` fetches the target user's logs, builds a system prompt with all log entries formatted as context, and streams the AI response back using the Vercel AI SDK's `streamText`.

## Architecture

### AI Provider Abstraction (Strategy Pattern)

The `AIProvider` interface defines a contract with two methods: `getModel(tier)` and `getModelId(tier)`. Concrete implementations exist for each vendor:

- **`OpenAIProviderImpl`** -- wraps `@ai-sdk/openai`
- **`GoogleProviderImpl`** -- wraps `@ai-sdk/google`
- **Anthropic** -- placeholder defined in types but not yet implemented

Providers are instantiated as singletons via `getProvider()` and cached in a `Map` registry. The active provider is determined by the `AI_PROVIDER` environment variable (defaults to `openai`).

### Model Tiers

Each provider maps three semantic tiers to specific model IDs:

| Tier | OpenAI | Google | Anthropic |
|---|---|---|---|
| `fast` | gpt-4o-mini | gemini-2.0-flash-lite | claude-3-haiku |
| `standard` | gpt-4o | gemini-2.0-flash | claude-3.5-sonnet |
| `powerful` | gpt-4o | gemini-2.0-pro | claude-3-opus |

Chat uses the `standard` tier by default. Monthly recaps use `fast`.

### Streaming Responses

Streaming is handled by the Vercel AI SDK (`ai` package). The backend calls `streamText()` which returns a streaming response that the Express controller pipes directly to the HTTP response. The frontend `ChatThread` component consumes this stream for real-time token rendering.

### Context Building

The `ChatService.buildLogsContext()` method:

1. Fetches logs for the target user within the date range.
2. Resolves project names for each unique `project_id`.
3. Returns an array of `LogContext` objects (date, project name, task description, time values).

The `buildSystemPrompt()` function in `prompts.ts` formats these into a structured prompt with:
- Summary statistics (total entries, unique projects, date range)
- Each log entry on its own line: `[date] ProjectName: description (Actual: X, Tracked: Y)`
- Capability list and behavioral guidelines
- A hard cap of 100 log entries to prevent context overflow

When no logs are available, `buildMinimalSystemPrompt()` is used instead, which guides the assistant to suggest loading a date range.

## API Endpoints

All endpoints require authentication.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send messages and stream AI response |
| `GET` | `/api/chat/context` | Get context metadata (log count, user info, date range) |

### POST /api/chat

**Request body:**
```json
{
  "messages": [{ "role": "user", "content": "Summarize my week" }],
  "context": {
    "startDate": "2026-03-28",
    "endDate": "2026-04-03",
    "targetUserId": 5
  }
}
```

**Response:** Streamed text (chunked transfer encoding).

## iOS Considerations

The chat layout uses `h-[calc(100vh-8rem)]` for full-height rendering. On mobile, the context panel stacks above the chat area with a max height of `40vh` and scrollable overflow, switching to a fixed-width sidebar on desktop (`md:w-80`).

## Extensibility

### Adding a New AI Provider

1. Create a new class implementing `AIProvider` in `backend/src/lib/ai/providers.ts`.
2. Add the provider type to `AIProviderType` in `types.ts`.
3. Add model tier mappings to the `MODEL_TIERS` constant.
4. Add the construction case in `getProvider()` (reads API key from env vars).
5. Set `AI_PROVIDER=<new_type>` in your environment.

No changes are needed in the service layer or frontend -- the abstraction handles everything.

### Customizing the System Prompt

Edit `buildSystemPrompt()` in `prompts.ts`. The prompt receives a `ChatContext` object with all user and log data. Add new sections, adjust tone, or include additional capabilities.

## Key Files

- `frontend/src/pages/ChatPage.tsx` -- Chat page with date range and user selection
- `frontend/src/components/chat/ChatThread.tsx` -- Streaming chat UI component
- `backend/src/routes/chat.ts` -- Route definitions
- `backend/src/services/chat.service.ts` -- Business logic (context building, streaming)
- `backend/src/lib/ai/providers.ts` -- AI provider registry (Strategy pattern)
- `backend/src/lib/ai/prompts.ts` -- System prompt builder
- `backend/src/lib/ai/types.ts` -- Shared type definitions for chat and AI
