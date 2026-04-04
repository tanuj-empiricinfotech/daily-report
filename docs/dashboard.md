# Dashboard

> Last updated: 2026-04-04

## Overview

The Dashboard is the main landing page of the application, providing a comprehensive analytics overview for time tracking. It adapts its content based on the authenticated user's role: **admins** see team-wide metrics, leaderboards, and team hours tracking, while **regular members** see their personal metrics and quick action shortcuts.

The default date range is the last 30 days, with a previous 30-day period calculated automatically for trend comparisons.

## How It Works

### Data Fetching (Role-Based)

The Dashboard conditionally fetches data depending on whether the user is an admin:

- **Admin**: Fetches team logs (`useTeamLogs`), all team projects (`useProjects`), and all users (`useUsers`).
- **Member**: Fetches only personal logs (`useMyLogs`) and personal projects (`useMyProjects`).

A single `logs` / `projects` variable is assigned based on the role, keeping downstream logic role-agnostic.

### Date Range Calculations

1. **Current period**: Computed via `getDateRange('30d')`, which returns `{ startDate, endDate }` as `YYYY-MM-DD` strings.
2. **Previous period**: The 30 days immediately before `startDate`, calculated in a `useMemo` block. This enables period-over-period trend comparison.
3. **Filtering**: `filterLogsByDateRange` splits logs into `currentPeriodLogs` and `previousPeriodLogs` by comparing each log's date string.

### KPI Metric Cards

Four metric cards are rendered inside a `MetricCardGrid` (responsive 1/2/4-column grid):

| Card | Value | Trend Comparison |
|------|-------|------------------|
| **Total Hours** | `formatDuration(totalHours)` (e.g. "42h 30m") | % change vs previous 30 days |
| **Active Projects** | Count of distinct `project_id` values in current logs | % change vs previous period |
| **Team Members** | Count of distinct `user_id` values in current logs | % change vs previous period |
| **Avg Hours/Day** | `totalHours / daysWithLogs` | Neutral trend (informational) |

The `MetricCard` component accepts `title`, `value`, `change`, `description`, `subtitle`, `icon`, and `loading` props. Trend direction (`up` / `down` / `neutral`) is auto-calculated from the `change` percentage via `getTrendFromChange()`, or can be overridden with the `trend` prop. The card renders a directional arrow icon and applies color coding (green for up, red for down, muted for neutral).

### Time Series Chart

The `TimeSeriesChart` component renders a Recharts `AreaChart` with gradient fill. Key behavior:

- Data is produced by `transformLogsToTimeSeries(logs, startDate, endDate)`, which generates one data point per calendar day (including zero-value days).
- Each point contains `{ date, displayDate, hours, trackedHours, logCount }`.
- Y-axis domain is auto-padded to 110% of max value.
- An optional range selector (7d / 30d / 3m) is shown in the card header.
- Custom tooltip shows hours and log count.

On the Dashboard, this chart spans 2 of 3 grid columns.

### Top Projects Chart

The `TopProjects` component shows a ranked bar/pie chart of project hours. Data is produced by `transformLogsToProjectChart`, which:

1. Aggregates `actual_time_spent` by `project_id`.
2. Maps project IDs to names via a `projectNameMap`.
3. Assigns colors from `generateChartColors`.
4. Sorts descending by hours and computes percentage of total.

Limited to the top 5 projects on the Dashboard.

### Recent Activity

The `RecentActivity` component displays the most recent log entries. On the Dashboard it shows 5 entries (from a fetched pool of 10). Admin view includes user names alongside project names.

### Team Performance Bar Chart (Admin Only)

The `TeamPerformance` component renders a horizontal `BarChart` (Recharts) showing hours per team member. Data comes from `transformLogsToUserChart`, which aggregates logs by `user_id` and maps to user names. Limited to the top 8 users by default. Each bar gets a unique color from `generateChartColors`. A legend with avatars and hour totals is rendered below the chart.

For non-admin users, a "Quick Actions" card with links to create/view logs replaces this section.

### Team Leaderboard (Admin Only)

The `TeamLeaderboard` component shows ALL team members ranked by hours logged. Key features:

- All users are included, even those with 0 hours (shown at the bottom).
- Top 3 members with nonzero hours get trophy/medal/award icons with gold/silver/bronze styling.
- Each row shows: rank indicator, colored avatar with initials, name, percentage of team total, formatted hours, and a proportional progress bar.
- A "Team Total" summary row appears at the bottom.
- Hours are aggregated from logs using `parseTimeInput` to handle string time formats.

### Team Hours Section (Admin Only)

The `TeamHoursSection` component provides a sortable, paginated table of team member hours. It defaults to the admin's own team.

## Role-Based Views

| Feature | Admin | Member |
|---------|-------|--------|
| KPI Metric Cards | Team-wide metrics | Personal metrics |
| Time Series Chart | Team hours over time | Personal hours over time |
| Top Projects | All team projects | Personal projects |
| Recent Activity | Shows user names | No user names |
| Team Performance | Horizontal bar chart | Quick Actions card |
| Team Leaderboard | Full ranked table | Hidden |
| Team Hours Section | Sortable/paginated table | Hidden |

## Chart Data Transformations

All chart data is produced by pure transformation functions in `utils/chart.ts`:

- `transformLogsToTimeSeries` -- Generates a complete date range, initializes zero values, aggregates log hours per day.
- `transformLogsToProjectChart` -- Aggregates by project, computes percentages, assigns colors.
- `transformLogsToUserChart` -- Aggregates by user, assigns colors, sorts descending.

Colors are generated by `generateChartColors` from `lib/theme.ts`.

## Key Files

- `frontend/src/pages/Dashboard.tsx` -- Main page component with role-based data fetching and layout
- `frontend/src/components/dashboard/MetricCard.tsx` -- KPI card with trend indicators and grid layout helper
- `frontend/src/components/dashboard/TimeSeriesChart.tsx` -- Recharts area chart with range selector
- `frontend/src/components/dashboard/TeamPerformance.tsx` -- Horizontal bar chart for team member hours
- `frontend/src/components/dashboard/TeamLeaderboard.tsx` -- Full ranked leaderboard table
- `frontend/src/components/dashboard/TeamHoursSection.tsx` -- Sortable/paginated team hours table
- `frontend/src/components/dashboard/TopProjects.tsx` -- Project distribution chart
- `frontend/src/components/dashboard/RecentActivity.tsx` -- Recent log entries list
- `frontend/src/utils/analytics.ts` -- Centralized analytics calculation functions
- `frontend/src/utils/chart.ts` -- Chart data transformation functions
