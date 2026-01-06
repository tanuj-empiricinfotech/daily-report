/**
 * Analytics Page
 * Advanced analytics and reporting with detailed charts
 * Admin-only page
 */

import { useMemo, useState } from 'react';
import { IconCalendar, IconClock, IconTrendingUp, IconUsers } from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { TopProjects } from '@/components/dashboard/TopProjects';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useAuth } from '@/hooks/useAuth';
import { useTeamLogs } from '@/lib/query/hooks/useLogs';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useUsers } from '@/lib/query/hooks/useUsers';
import type { DailyLog } from '@/lib/api/types';
import {
  calculateTotalHours,
  calculateTrend,
  formatDuration,
  getDateRange,
} from '@/utils/analytics';
import {
  transformLogsToTimeSeries,
  transformLogsToProjectChart,
  transformLogsToUserChart,
} from '@/utils/chart';
import { generateChartColors } from '@/lib/theme';

// Time range options
const TIME_RANGES = {
  '7d': { label: 'Last 7 Days', days: 7 },
  '30d': { label: 'Last 30 Days', days: 30 },
  '90d': { label: 'Last 90 Days', days: 90 },
  '180d': { label: 'Last 6 Months', days: 180 },
  '365d': { label: 'Last Year', days: 365 },
} as const;

type TimeRangeKey = keyof typeof TIME_RANGES;

export function Analytics() {
  const { user, isAdmin } = useAuth();
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('30d');

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Calculate date ranges based on selection
  const { startDate, endDate } = getDateRange(selectedRange);

  // Fetch data
  const { data: logs = [], isLoading: logsLoading } = useTeamLogs(
    user?.team_id || null,
    { startDate, endDate }
  );
  const { data: projects = [], isLoading: projectsLoading } = useProjects(
    user?.team_id || null
  );
  const { data: users = [], isLoading: usersLoading } = useUsers();

  // Calculate previous period for comparison
  const { startDate: prevStartDate, endDate: prevEndDate } = useMemo(() => {
    const daysInRange = TIME_RANGES[selectedRange].days;
    const end = new Date(startDate);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - daysInRange);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [startDate, selectedRange]);

  // Filter logs by current and previous periods
  const currentPeriodLogs = useMemo(() => {
    return logs.filter((log: DailyLog) => {
      const logDate =
        typeof log.date === 'string'
          ? log.date.split('T')[0]
          : new Date(log.date).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });
  }, [logs, startDate, endDate]);

  const previousPeriodLogs = useMemo(() => {
    return logs.filter((log: DailyLog) => {
      const logDate =
        typeof log.date === 'string'
          ? log.date.split('T')[0]
          : new Date(log.date).toISOString().split('T')[0];
      return logDate >= prevStartDate && logDate <= prevEndDate;
    });
  }, [logs, prevStartDate, prevEndDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const currentHours = calculateTotalHours(currentPeriodLogs);
    const previousHours = calculateTotalHours(previousPeriodLogs);
    const hoursChange = calculateTrend(currentHours, previousHours);

    const totalLogs = currentPeriodLogs.length;
    const previousTotalLogs = previousPeriodLogs.length;
    const logsChange = calculateTrend(totalLogs, previousTotalLogs);

    const activeUsers = new Set(currentPeriodLogs.map((l: DailyLog) => l.user_id)).size;
    const previousActiveUsers = new Set(
      previousPeriodLogs.map((l: DailyLog) => l.user_id)
    ).size;
    const usersChange = calculateTrend(activeUsers, previousActiveUsers);

    const avgHoursPerUser = activeUsers > 0 ? currentHours / activeUsers : 0;

    return {
      totalHours: currentHours,
      hoursChange,
      totalLogs,
      logsChange,
      activeUsers,
      usersChange,
      avgHoursPerUser,
    };
  }, [currentPeriodLogs, previousPeriodLogs]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    return transformLogsToTimeSeries(currentPeriodLogs, startDate, endDate);
  }, [currentPeriodLogs, startDate, endDate]);

  // Project chart data
  const projectChartData = useMemo(() => {
    const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));
    const colors = generateChartColors(projects.length);
    return transformLogsToProjectChart(currentPeriodLogs, projectNameMap, colors);
  }, [currentPeriodLogs, projects]);

  // User chart data
  const userChartData = useMemo(() => {
    const userInfoMap = new Map(users.map((u) => [u.id, { name: u.name }]));
    const colors = generateChartColors(users.length);
    return transformLogsToUserChart(currentPeriodLogs, userInfoMap, colors);
  }, [currentPeriodLogs, users]);

  // Maps for recent activity
  const projectNameMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  const userNameMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, u.name]));
  }, [users]);

  const isLoading = logsLoading || projectsLoading || usersLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into team performance and productivity
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <IconCalendar className="h-5 w-5 text-muted-foreground" />
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value as TimeRangeKey)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Object.entries(TIME_RANGES).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Metrics */}
      <MetricCardGrid columns={4}>
        <MetricCard
          title="Total Hours"
          value={formatDuration(metrics.totalHours)}
          change={metrics.hoursChange}
          description={`${TIME_RANGES[selectedRange].label.toLowerCase()}`}
          subtitle="vs previous period"
          icon={<IconClock className="h-5 w-5" />}
          loading={isLoading}
        />
        <MetricCard
          title="Total Logs"
          value={metrics.totalLogs}
          change={metrics.logsChange}
          description="Work log entries"
          subtitle="vs previous period"
          icon={<IconTrendingUp className="h-5 w-5" />}
          loading={isLoading}
        />
        <MetricCard
          title="Active Members"
          value={metrics.activeUsers}
          change={metrics.usersChange}
          description="Team members logging"
          subtitle="vs previous period"
          icon={<IconUsers className="h-5 w-5" />}
          loading={isLoading}
        />
        <MetricCard
          title="Avg Hours/Member"
          value={`${metrics.avgHoursPerUser.toFixed(1)}h`}
          trend="neutral"
          description="Average per active member"
          subtitle={`${metrics.activeUsers} active members`}
          icon={<IconClock className="h-5 w-5" />}
          loading={isLoading}
        />
      </MetricCardGrid>

      {/* Time Series Chart - Full Width */}
      <TimeSeriesChart
        title="Hours Logged Over Time"
        description={`Daily breakdown for ${TIME_RANGES[selectedRange].label.toLowerCase()}`}
        data={timeSeriesData}
        height={400}
        loading={isLoading}
      />

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopProjects
          data={projectChartData}
          limit={10}
          height={400}
          loading={isLoading}
        />

        <TeamPerformance
          data={userChartData}
          limit={10}
          height={400}
          loading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest work log entries from the team</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivity
            logs={logs.slice(0, 20)}
            projectNames={projectNameMap}
            userNames={userNameMap}
            showUser={true}
            limit={20}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
