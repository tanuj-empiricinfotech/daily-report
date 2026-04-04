# Authentication and Authorization

> Last updated: 2026-04-04 (sessions management added)

## Overview

The application uses a JWT-based authentication system with short-lived access tokens and long-lived refresh tokens. Refresh tokens are rotated on every use and stored as SHA-256 hashes in the database. The frontend handles token refresh transparently, including a proactive refresh on app load and a request queue to prevent concurrent 401 race conditions. Cookie configuration adapts automatically to HTTP (development) and HTTPS (production) environments.

## How It Works

### Token Lifecycle

1. **Login/Register**: The backend generates an access token (15 min) and a refresh token (7 days), both signed with HS256. Both are set as httpOnly cookies and returned in the JSON response body (for clients that cannot use cookies).
2. **Authenticated requests**: The frontend Axios client attaches the token via a request interceptor (`Authorization: Bearer <token>`). The backend auth middleware checks three sources in order: cookie (`token`), `Authorization` header, query parameter (`?token=`).
3. **Token expiry**: When a request returns 401, the Axios response interceptor calls `POST /api/auth/refresh` with the refresh token cookie. On success, both tokens are rotated (old refresh token deleted, new pair issued).
4. **Proactive refresh**: On app load, `refreshTokenOnLoad()` decodes the access token's `exp` claim (without verification) and refreshes proactively if it expires within 60 seconds. This prevents a flash of unauthenticated state.
5. **Logout**: `POST /api/auth/logout` revokes the refresh token and clears both cookies.

### Token Rotation

Every call to the refresh endpoint deletes the old refresh token hash from the database and issues a new pair. This means:

- A stolen refresh token can only be used once.
- If the legitimate user and an attacker both try to use the same refresh token, the second attempt fails, alerting to a compromise.
- The `device_info` (User-Agent) is stored with each refresh token for audit purposes.

### SHA-256 Hashed Storage

Refresh tokens are never stored in plaintext. The backend hashes them with `crypto.createHash('sha256')` before insert and compares hashes on lookup. This ensures that a database breach does not directly expose usable tokens.

### Triple Auth Fallback

The `authenticate` middleware resolves the access token from three sources, tried in order:

1. **Cookie** (`req.cookies.token`) -- Primary method, works in same-origin and cross-origin HTTPS setups.
2. **Authorization header** (`Bearer <token>`) -- Used by the Axios client for reliability, especially on iOS Safari.
3. **Query parameter** (`?token=<token>`) -- Fallback for SSE connections (`EventSource` cannot set headers or cookies).

### Request Queue for Concurrent 401s

When multiple requests fail with 401 simultaneously:

1. The first failing request sets `isRefreshing = true` and calls the refresh endpoint.
2. Subsequent 401 responses are queued in `failedQueue` as promises.
3. When the refresh resolves, `processQueue` replays all queued requests with the new token.
4. If the refresh fails, all queued requests are rejected and the user is redirected to `/login`.

### Admin Session Termination

Admins can terminate user sessions via `revokeAllUserSessions(userId)`, which calls `deleteAllByUserId` on the refresh tokens repository. This deletes all refresh tokens for the target user, forcing them to re-authenticate on their next token refresh.

### Force Logout on Password Change

When a user changes their password (`PUT /api/auth/password`):

1. The backend verifies the current password and validates the new one (must differ from current).
2. The password hash is updated in the database.
3. All refresh tokens for the user are deleted (`deleteAllByUserId`), invalidating every active session.
4. The frontend shows a success message, then calls `logout()` and redirects to `/login` after 1.5 seconds.

### Cookie Configuration

The `getCookieOptions` function in the auth controller dynamically determines cookie settings:

| Environment | `secure` | `sameSite` | Reason |
|-------------|----------|------------|--------|
| HTTPS (production, Vercel, tunnels) | `true` | `none` | Required for cross-origin requests with credentials |
| HTTP (localhost development) | `false` | `lax` | CSRF protection while allowing local development |

HTTPS detection checks multiple signals: `req.protocol`, `req.secure`, `X-Forwarded-Proto` header, and a `BACKEND_HTTPS` environment variable override.

Cookie max ages:
- Access token cookie: 15 minutes
- Refresh token cookie: 7 days

### storage.service as Single Source of Truth

All localStorage access goes through `storage.service.ts`, which provides type-safe getters/setters with error handling. The auth token is stored under the key `auth_token`. This centralizes storage access, making it easy to audit what is persisted and to swap the storage backend if needed.

## Architecture

```
Frontend                                      Backend
--------                                      -------
lib/api/client.ts (Axios interceptors)       routes/auth.ts
  +-- refreshAccessToken()                   controllers/auth.controller.ts
  +-- refreshTokenOnLoad()                     +-- getCookieOptions()
  +-- request interceptor (Bearer header)    services/auth.service.ts
  +-- response interceptor (401 queue)         +-- register / login / refresh / logout
                                               +-- changePassword (revokes all sessions)
lib/storage.service.ts                       middleware/auth.ts
  +-- getAuthToken / setAuthToken              +-- authenticate (triple fallback)
  +-- clearAuthToken                           +-- requireAdmin
                                             utils/jwt.ts
                                               +-- generateAccessToken (15m, HS256)
                                               +-- generateRefreshToken (7d, HS256)
                                             db/repositories/refresh-tokens.repository.ts
                                               +-- SHA-256 hash storage
                                               +-- token rotation (delete + create)
```

## API Endpoints

All endpoints are prefixed with `/api/auth`.

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| `POST` | `/register` | No | Create account, returns tokens |
| `POST` | `/login` | No | Authenticate, returns tokens |
| `POST` | `/logout` | No | Revoke refresh token, clear cookies |
| `POST` | `/refresh` | No | Rotate tokens (refresh token in cookie or body) |
| `PUT` | `/password` | Yes | Change password (rate limited), revokes all sessions |
| `GET` | `/sessions` | Yes | List active sessions for current user |
| `DELETE` | `/sessions/:id` | Yes | Revoke a specific session |
| `DELETE` | `/sessions` | Yes | Revoke all sessions except current |

### Session Management

Users can view and manage their active sessions under **Settings > Security**. Each session shows:
- Browser and OS (parsed from User-Agent)
- Login time (relative)
- "This device" badge for the current session
- "Revoke" button (disabled for current session)
- "Revoke all other sessions" button

Admins can also terminate all sessions for any user from the Team management page.

### Request/Response Examples

**Login**:
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "success": true, "data": { user object }, "token": "access_token" }
Set-Cookie: token=...; refresh_token=...
```

**Refresh**:
```
POST /api/auth/refresh
Cookie: refresh_token=...
Response: { "success": true, "token": "new_access_token" }
Set-Cookie: token=...; refresh_token=...
```

**List Sessions**:
```
GET /api/auth/sessions
Response: { "success": true, "data": [{ "id": 1, "device_info": "Mozilla/5.0 ...", "created_at": "...", "is_current": true }, ...] }
```

## iOS Considerations

iOS Safari has strict cookie policies for cross-origin requests, particularly in WKWebView and when using third-party cookie blocking. To handle this:

- The frontend always sends the access token via the `Authorization: Bearer` header in addition to cookies.
- The login and refresh responses include the token in the JSON body so the frontend can store it in localStorage as a fallback.
- SSE connections pass the token as a query parameter since `EventSource` does not support custom headers.
- `storage.service.ts` wraps all `localStorage` calls in try-catch to handle private browsing restrictions.

## Extensibility

- **OAuth/SSO**: Add new routes and a strategy pattern in `AuthService` to support external identity providers without modifying existing password-based logic.
- **Multi-factor authentication**: Insert an MFA verification step between password validation and token issuance in the `login` method.
- **Session management UI**: The `findByUserId` method on the refresh tokens repository already supports listing active sessions with device info and creation timestamps.
- **Rate limiting**: Password change already has a dedicated rate limiter (`passwordChangeRateLimiter`). Additional rate limiting can be added per-route.

## Key Files

- `/frontend/src/lib/api/client.ts` -- Axios client with interceptors, refresh logic, and request queue
- `/frontend/src/lib/storage.service.ts` -- Type-safe localStorage wrapper (auth token, themes, drafts)
- `/backend/src/routes/auth.ts` -- Auth route definitions
- `/backend/src/controllers/auth.controller.ts` -- Cookie configuration and response handling
- `/backend/src/services/auth.service.ts` -- Auth business logic (register, login, refresh, password change)
- `/backend/src/utils/jwt.ts` -- HS256 token generation and verification
- `/backend/src/middleware/auth.ts` -- Triple-fallback authentication middleware
- `/backend/src/db/repositories/refresh-tokens.repository.ts` -- SHA-256 hashed token storage
