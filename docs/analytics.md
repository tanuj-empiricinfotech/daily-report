# Analytics

> Last updated: 2026-04-04

## Overview

The analytics system consists of two layers: a dedicated **Analytics page** (`pages/Analytics.tsx`) for admin-only advanced reporting, and a shared set of **utility functions** (`utils/analytics.ts`, `utils/chart.ts`) that power both the Analytics page and the Dashboard.

## Analytics Page

The Analytics page (`/analytics`) is restricted to admin users. Non-admins see a permission denied message. It provides:

- **Team selector**: Dropdown to switch between teams.
- **Time range selector**: Dropdown with options from 1 day to 1 year (`1d`, `7d`, `30d`, `90d`, `180d`, `365d`).
- **KPI cards**: Total Hours, Total Logs, Active Members, Avg Hours/Member -- each with period-over-period trend comparison.
- **Full-width time series chart**: Daily hours breakdown at 400px height.
- **Side-by-side charts**: Top Projects (limit 10) and Team Performance (limit 10), each at 400px height.
- **Recent activity**: Up to 20 recent log entries with user names.

The previous period is dynamically sized to match the selected range (e.g., selecting "Last 90 Days" compares against the 90 days before that).

## Analytics Utilities (`utils/analytics.ts`)

Centralized pure functions for analytics calculations. All functions accept `DailyLog[]` arrays and handle both string and numeric time formats via `parseTimeInput`.

### Core Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `calculateTotalHours` | `(logs: DailyLog[]) => number` | Sums `actual_time_spent` across all logs. |
| `calculateTrend` | `(current: number, previous: number) => number` | Returns percentage change. Returns 100 if previous is 0 and current > 0; returns 0 if both are 0. |
| `formatTrendPercentage` | `(value: number) => string` | Formats as `+12.3%` or `-5.0%`. |
| `formatDuration` | `(hours: number) => string` | Converts decimal hours to human-readable format (e.g., `2.5` becomes `"2h 30m"`). |
| `formatHoursDecimal` | `(hours: number, precision?) => string` | Formats hours as a fixed-precision decimal string. |

### Aggregation Functions

| Function | Groups By | Key in Map | Value |
|----------|-----------|------------|-------|
| `aggregateByDate` | `log.date` (YYYY-MM-DD) | `string` | `{ totalHours, logs }` |
| `aggregateByProject` | `log.project_id` | `number` | `{ totalHours, logs }` |
| `aggregateByUser` | `log.user_id` | `number` | `{ totalHours, logs }` |

Each returns a `Map` and uses `parseTimeInput` to normalize string/number time values.

### Date Utilities

| Function | Description |
|----------|-------------|
| `getDateRange(range)` | Accepts `'1d'`, `'7d'`, `'30d'`, `'90d'`, `'180d'`, `'365d'`, `'3m'`, or `'custom'`. Returns `{ startDate, endDate }` as YYYY-MM-DD strings. |
| `generateDateRange(start, end)` | Returns an array of all YYYY-MM-DD date strings between start and end (inclusive). |
| `formatDateDisplay(date, format)` | Formats a date for display. Supports `'short'` (default), `'long'`, and `'month'` formats. |
| `getCurrentDate()` | Returns today's date as YYYY-MM-DD in local timezone. |

### Other Utilities

| Function | Description |
|----------|-------------|
| `calculateTimeVariance(logs)` | Returns `{ actualTotal, trackedTotal, variance, variancePercent }` comparing actual vs tracked time. |
| `calculateAverageHoursPerDay(logs, days?)` | Average hours per unique day with logs, or per a specified number of days. |
| `calculateCompletionRate(completed, total)` | Simple percentage calculation for task completion. |
| `getTopItems(items, getKey, limit)` | Generic top-N grouping by a key function, sorted by count descending. |
| `getUserInitials(name)` | Extracts initials for avatar fallback (e.g., "John Doe" becomes "JD"). |

## Chart Utilities (`utils/chart.ts`)

Pure transformation functions that convert `DailyLog[]` arrays into chart-ready data structures for Recharts.

### Data Types

```typescript
interface TimeSeriesData {
  date: string;           // YYYY-MM-DD
  displayDate: string;    // e.g. "Apr 3"
  hours: number;
  trackedHours: number;
  logCount: number;
}

interface ProjectChartData {
  name: string;
  hours: number;
  percentage: number;
  fill: string;           // Color from generateChartColors
}

interface UserChartData {
  name: string;
  hours: number;
  avatar?: string;
  fill: string;
}
```

### Transformation Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `transformLogsToTimeSeries` | `(logs, startDate, endDate)` | `TimeSeriesData[]` | Generates one entry per calendar day in the range (including zero-value days). Aggregates actual and tracked hours plus log count per day. |
| `transformLogsToProjectChart` | `(logs, projectNames, colors)` | `ProjectChartData[]` | Aggregates hours by project, computes percentage of total, assigns colors, sorts descending. |
| `transformLogsToUserChart` | `(logs, userNames, colors)` | `UserChartData[]` | Aggregates hours by user, assigns colors, sorts descending. |

### Chart Configuration Helpers

| Export | Description |
|--------|-------------|
| `formatChartTooltip(value, name)` | Formats tooltip values based on name (hours get `Xh Ym`, percentages get `X.Y%`). |
| `getAxisTickFormatter(type)` | Returns a tick formatter function for `'hours'`, `'date'`, or `'number'` axis types. |
| `calculateChartDomain(data, padding)` | Computes `[min, max]` domain with configurable padding (default 10%). |
| `responsiveChartConfig` | Preset height/tickCount for `small` (200px), `medium` (300px), `large` (400px). |
| `getResponsiveChartConfig(width)` | Selects config based on container width breakpoints (400px, 800px). |
| `defaultChartMargins` | `{ top: 10, right: 10, bottom: 20, left: 40 }` |
| `chartAnimationConfig` | `{ duration: 500, easing: 'ease-out' }` |

## Key Files

- `frontend/src/pages/Analytics.tsx` -- Admin-only analytics page with team/time selectors
- `frontend/src/utils/analytics.ts` -- Centralized analytics calculation and formatting functions
- `frontend/src/utils/chart.ts` -- Chart data transformation functions and configuration helpers
- `frontend/src/lib/theme.ts` -- `generateChartColors` for consistent chart color palettes
