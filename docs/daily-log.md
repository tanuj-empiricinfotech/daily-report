# Daily Log

> Last updated: 2026-04-04

## Overview

The Daily Log feature is the core of the application. Users log their daily work entries against assigned projects, tracking both actual time spent and time tracked in external tools. Admins have elevated access: they can view team-wide logs, create entries on behalf of other users, and edit past entries.

## How It Works

1. The **DailyLog** page displays a filterable data table of log entries. Members see their own logs; admins see the entire team's logs.
2. Clicking **New Log** navigates to the **CreateLogPage**, which renders the **MultiRowLogForm** -- a table-style form that supports multiple task rows in a single submission.
3. On submit the frontend calls the bulk-create endpoint (`POST /api/logs/bulk`) so all rows are persisted in one request.
4. The backend validates date access (members can only log for today), project assignment, and time format before persisting.

## Multi-Row Log Entry

The `MultiRowLogForm` renders a table with columns: **Project**, **Task Description**, **Actual Time**, **Tracked Time**, and **Actions** (add/remove row). Each row is independently validated. New rows auto-copy the project selection from the previous row for convenience.

## Time Tracking (Actual vs Tracked)

Every row captures two time values in `HH:MM` format:

- **Actual Time Spent** -- real time the user worked on the task.
- **Tracked Time** -- time recorded in an external tracker (e.g. Toggl, Clockify).

Input is flexible: typing `3` auto-normalizes to `3:00` on blur. The form footer displays running totals for both columns.

## Date Picker (CalendarDatePicker)

The form uses a single-date `CalendarDatePicker` component. Members are restricted to today's date on the backend (a `ForbiddenError` is thrown for other dates). Admins may select any date.

## Admin vs Member Views

| Capability | Member | Admin |
|---|---|---|
| View logs | Own logs only | Entire team |
| Filters | Single project select | Multi-select project + user |
| Create log for others | No | Yes (user selector in form) |
| Edit/delete past logs | Today only | Any date |

When an admin selects a user in the form, the project dropdown filters to that user's assigned projects (fetched via `useUsersWithProjectsByTeam`).

## Filtering

The `DailyLog` page provides:

- **DateRangePicker** -- filters logs by date range (default: today).
- **Project filter** -- single-select for members, multi-select for admins.
- **User filter** -- multi-select, admin-only.

Filtering is applied on both the API level (date range sent as query params) and the frontend (additional date normalization to handle timezone edge cases).

## API Endpoints

All endpoints require authentication (`authenticate` middleware).

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/logs` | Create a single log entry |
| `POST` | `/api/logs/bulk` | Create multiple log entries at once |
| `GET` | `/api/logs/my` | Get authenticated user's logs (with optional date filters) |
| `GET` | `/api/logs/team/:teamId` | Get team logs (admin only) |
| `GET` | `/api/logs/:id` | Get a single log by ID |
| `PUT` | `/api/logs/:id` | Update a log entry |
| `DELETE` | `/api/logs/:id` | Delete a log entry |

## Form Persistence (Redux + localStorage)

The `useLogFormPersistence` hook provides two modes:

- **Create mode**: Form state (date, rows, selected user) is stored in a Redux slice (`logFormSlice`) which is synced to localStorage. If the user navigates away mid-entry, their progress is restored on return. State is cleared after successful submission or explicit cancel.
- **Edit mode**: Uses local React state with no persistence, initialized from `initialData`.

## Seasonal Events Adapter (April Fools Button Prank)

The `DailyLog` page integrates with the `useSeasonalEvent` hook. When a seasonal event with `buttonPrank.enabled` is active (e.g. April Fools), the **New Log** button dodges the cursor for a random number of attempts (between `minDodges` and `maxDodges`). After catching it, a confetti effect fires and a toast appears before navigating to the create page. The prank is driven entirely by configuration in the seasonal events system -- no hardcoded dates in the component.

## Extensibility

- **New filters**: Add filter state to `DailyLog` and pass to the `filteredLogs` memo. The backend already supports `userId` and `projectId` query params on the team endpoint.
- **New form fields**: Add the field to the `LogRow` interface in `logFormSlice.ts`, update `MultiRowLogForm` to render the input, and extend `CreateLogDto` / the bulk validator on the backend.
- **New seasonal events**: Implement a new event adapter in the seasonal events system. The `DailyLog` component will pick it up automatically via `useSeasonalEvent`.

## Key Files

- `frontend/src/pages/DailyLog.tsx` -- Main log listing page with filters
- `frontend/src/pages/CreateLogPage.tsx` -- Create page that hosts the form
- `frontend/src/components/logs/MultiRowLogForm.tsx` -- Multi-row form component
- `frontend/src/store/slices/logFormSlice.ts` -- Redux slice for form persistence
- `frontend/src/hooks/useLogFormPersistence.ts` -- Hook bridging Redux (create) and local state (edit)
- `backend/src/routes/logs.ts` -- Express route definitions
- `backend/src/services/logs.service.ts` -- Business logic (validation, authorization, CRUD)
