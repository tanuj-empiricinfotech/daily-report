# Monthly Recap

> Last updated: 2026-04-04

## Overview

The Monthly Recap feature generates a Spotify Wrapped-style presentation of a user's work data for any given month. It computes statistics from daily logs, calls AI for narrative content, caches the result in the database, and presents it as a full-screen swipeable slide deck with Framer Motion animations.

## How It Works

1. A **banner** appears on all pages during the first 5 days of each month, prompting the user to view last month's recap.
2. Clicking the banner triggers a fetch to `GET /api/recaps/:year/:month`. If a cached recap exists it is returned instantly; otherwise the backend generates one on the fly.
3. The **RecapViewer** renders the slides in a full-screen overlay with swipe navigation, tap zones, keyboard support, and a progress bar.
4. Slide progress is persisted via `PATCH /api/recaps/:id/progress` so users resume where they left off.

## Architecture

### Generation Pipeline

The `MonthlyRecapService.generateRecap()` method orchestrates four steps:

1. **Fetch** -- `fetchLogsWithProjects()` retrieves logs for the date range and batch-resolves project names.
2. **Compute** -- `computeSlideStats()` calculates all data-driven metrics (hours, streaks, busiest day, team ranking, month-over-month comparison).
3. **AI Content** -- `generateAIContent()` builds a prompt from stats and calls the AI (`fast` tier) to produce narrative insight, highlights, a fun fact, and an emoji. Falls back to template-generated defaults if AI fails.
4. **Assemble** -- `assembleSlides()` combines stats and AI content into the final 8-slide array.

### The 8 Slide Types

| # | Type | Content |
|---|---|---|
| 1 | `welcome` | User name, month/year, total log count |
| 2 | `total-hours` | Total hours, avg hours/day, days logged, month-over-month comparison |
| 3 | `top-projects` | Up to 5 projects ranked by hours with percentages |
| 4 | `busiest-day` | Date, day of week, hours, task count, top project |
| 5 | `streaks-patterns` | Longest streak, current streak, most productive day of week |
| 6 | `ai-insight` | AI-generated narrative, 3 highlights, emoji |
| 7 | `team-standing` | Rank, total members, user hours vs team average, percentile |
| 8 | `summary` | Total hours, top project, days logged, AI fun fact |

### Caching

Generated recaps are stored in the database via `MonthlyRecapRepository.upsert()`. Subsequent requests for the same user/month return the cached version. If the recap was generated for the current month (partial data), it is flagged as `isPartial` and can be regenerated later.

### Streak Calculation (Weekends + Indian Holidays)

The `computeStreaks()` function in `recap-analytics.ts` counts working-day streaks where weekends and Indian holidays do **not** break the streak. Only missed working days reset it.

Holiday handling:
- **Fixed holidays** (Republic Day, Independence Day, Gandhi Jayanti, etc.) are included for all years.
- **Variable holidays** (Holi, Diwali, Eid, etc.) are defined per year (currently 2026 and 2027).
- The `isGapAllNonWorking()` helper checks whether all days between two logged dates are non-working days. If so, the streak continues.

### Cron Job

The `MonthlyRecapJob` runs on a cron schedule of `30 3 28-31 * *` (3:30 UTC / 9:00 AM IST on the 28th-31st). On each trigger, the handler checks `isLastDayOfMonth()` -- since cron has no "last day" syntax, this guard ensures it only runs once. The job iterates over all users and calls `getOrGenerateRecap()` for the current month, pre-populating the cache before users see the banner.

### Banner Visibility Window

The `MonthlyRecapBanner` component shows during the first 5 days of each month (controlled by the `VISIBILITY_DAYS` constant). It checks `useAvailableRecaps()` to confirm the previous month has log data. The banner is dismissible within a session (state is not persisted across page reloads). When opened, it shows a loading overlay while the recap generates, then renders the `RecapViewer`.

### Framer Motion Animations

The `RecapViewer` uses:
- **`AnimatePresence`** with directional `slideVariants` (enter from right when advancing, left when going back).
- **Drag gestures** with a 50px swipe threshold.
- **Progress bar** with animated width per segment.
- **Background gradients** that change per slide type (defined in `SLIDE_GRADIENTS`).

## API Endpoints

All endpoints require authentication.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/recaps/available` | List months with log data and generation status |
| `GET` | `/api/recaps/:year/:month` | Get or generate a monthly recap |
| `PATCH` | `/api/recaps/:id/progress` | Update last-viewed slide index |

## Extensibility

### Adding a New Slide Type

1. Define the new slide data shape in the `RecapSlide` union type.
2. Add the computation logic in `computeSlideStats()` or as a new helper in `recap-analytics.ts`.
3. Insert the slide object in `assembleSlides()` at the desired position.
4. Create a new React component (e.g. `NewSlide.tsx`) in `frontend/src/components/recap/slides/`.
5. Add the case to the `renderSlide()` switch in `RecapViewer.tsx`.
6. Add a gradient entry in `SLIDE_GRADIENTS`.

### Adding Holiday Definitions for New Years

In `recap-analytics.ts`, add a new `if (year === YYYY)` block inside `getIndianHolidays()` with the variable holiday dates for that year. Fixed holidays are already handled for all years.

### Changing the AI Tone

Edit `buildMonthlyRecapPrompt()` in `prompts.ts`. The prompt's "Tone Guidelines" section controls the personality. The AI output schema (`insight`, `highlights`, `funFact`, `emoji`) is validated on parse with fallback defaults.

## Key Files

- `backend/src/services/monthly-recap.service.ts` -- Core generation and caching logic
- `backend/src/utils/recap-analytics.ts` -- Pure computation functions (streaks, rankings, aggregation)
- `backend/src/jobs/monthly-recap.job.ts` -- Cron job for pre-generation
- `backend/src/routes/recaps.ts` -- Route definitions
- `backend/src/lib/ai/prompts.ts` -- AI prompt builder (includes `buildMonthlyRecapPrompt`)
- `frontend/src/components/recap/RecapViewer.tsx` -- Full-screen slide viewer with animations
- `frontend/src/components/recap/MonthlyRecapBanner.tsx` -- Banner shown in first 5 days of month
- `frontend/src/components/recap/slides/` -- Individual slide components
