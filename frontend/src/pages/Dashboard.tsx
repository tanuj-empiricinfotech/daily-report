/**
 * Dashboard Page
 * Main analytics overview page with KPI metrics and charts
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    IconClock,
    IconFolder,
    IconUsers,
    IconTrendingUp,
    IconPlus,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TopProjects } from '@/components/dashboard/TopProjects';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { TeamHoursSection } from '@/components/dashboard/TeamHoursSection';
import { useAuth } from '@/hooks/useAuth';
import { useMyLogs, useTeamLogs } from '@/lib/query/hooks/useLogs';
import { useMyProjects, useProjects } from '@/lib/query/hooks/useProjects';
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

export function Dashboard() {
    const { user, isAdmin } = useAuth();

    // Calculate date ranges
    const { startDate, endDate } = getDateRange('30d');

    // Fetch data based on role
    const { data: myLogs = [], isLoading: myLogsLoading } = useMyLogs(
        undefined,
        startDate,
        endDate,
        !isAdmin
    );
    const { data: teamLogs = [], isLoading: teamLogsLoading } = useTeamLogs(
        isAdmin && user?.team_id ? user.team_id : null,
        { startDate, endDate }
    );

    // Fetch projects based on role
    const { data: myProjects = [], isLoading: myProjectsLoading } = useMyProjects();
    const { data: allProjects = [], isLoading: allProjectsLoading } = useProjects(isAdmin && user?.team_id ? user.team_id : null, isAdmin);

    // Fetch users only for admin
    const { data: users = [], isLoading: usersLoading } = useUsers(isAdmin);

    // Use appropriate data based on role
    const logs = isAdmin ? teamLogs : myLogs;
    const logsLoading = isAdmin ? teamLogsLoading : myLogsLoading;
    const projects = isAdmin ? allProjects : myProjects;
    const projectsLoading = isAdmin ? allProjectsLoading : myProjectsLoading;

    // Calculate previous period date range
    const { startDate: prevStartDate, endDate: prevEndDate } = useMemo(() => {
        const end = new Date(startDate);
        end.setDate(end.getDate() - 1);
        const start = new Date(end);
        start.setDate(start.getDate() - 30);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, [startDate]);

    // Filter logs by date range
    const currentPeriodLogs = useMemo(() => {
        return logs.filter((log: DailyLog) => {
            const logDate = typeof log.date === 'string'
                ? log.date.split('T')[0]
                : new Date(log.date).toISOString().split('T')[0];
            return logDate >= startDate && logDate <= endDate;
        });
    }, [logs, startDate, endDate]);

    const previousPeriodLogs = useMemo(() => {
        return logs.filter((log: DailyLog) => {
            const logDate = typeof log.date === 'string'
                ? log.date.split('T')[0]
                : new Date(log.date).toISOString().split('T')[0];
            return logDate >= prevStartDate && logDate <= prevEndDate;
        });
    }, [logs, prevStartDate, prevEndDate]);

    // Calculate KPI metrics
    const metrics = useMemo(() => {
        const currentHours = calculateTotalHours(currentPeriodLogs);
        const previousHours = calculateTotalHours(previousPeriodLogs);
        const hoursChange = calculateTrend(currentHours, previousHours);

        const activeProjects = new Set(currentPeriodLogs.map((l: DailyLog) => l.project_id)).size;
        const previousActiveProjects = new Set(previousPeriodLogs.map((l: DailyLog) => l.project_id)).size;
        const projectsChange = calculateTrend(activeProjects, previousActiveProjects);

        const activeUsers = new Set(currentPeriodLogs.map((l: DailyLog) => l.user_id)).size;
        const previousActiveUsers = new Set(previousPeriodLogs.map((l: DailyLog) => l.user_id)).size;
        const usersChange = calculateTrend(activeUsers, previousActiveUsers);

        // Average hours per day
        const daysWithLogs = new Set(currentPeriodLogs.map((log: DailyLog) => {
            const date = typeof log.date === 'string'
                ? log.date.split('T')[0]
                : new Date(log.date).toISOString().split('T')[0];
            return date;
        })).size;
        const avgHoursPerDay = daysWithLogs > 0 ? currentHours / daysWithLogs : 0;

        return {
            totalHours: currentHours,
            hoursChange,
            activeProjects,
            projectsChange,
            activeUsers,
            usersChange,
            avgHoursPerDay,
        };
    }, [currentPeriodLogs, previousPeriodLogs]);

    // Time series data
    const timeSeriesData = useMemo(() => {
        return transformLogsToTimeSeries(currentPeriodLogs, startDate, endDate);
    }, [currentPeriodLogs, startDate, endDate]);

    // Project chart data
    const projectChartData = useMemo(() => {
        const projectNameMap = new Map(projects.map(p => [p.id, p.name]));
        const colors = generateChartColors(projects.length);
        return transformLogsToProjectChart(currentPeriodLogs, projectNameMap, colors);
    }, [currentPeriodLogs, projects]);

    // User chart data (for team performance - admin only)
    const userChartData = useMemo(() => {
        if (!isAdmin) return [];
        const userInfoMap = new Map(users.map(u => [u.id, { name: u.name }]));
        const colors = generateChartColors(users.length);
        return transformLogsToUserChart(currentPeriodLogs, userInfoMap, colors);
    }, [currentPeriodLogs, users, isAdmin]);

    // Project name map for recent activity
    const projectNameMap = useMemo(() => {
        return new Map(projects.map(p => [p.id, p.name]));
    }, [projects]);

    // User name map for recent activity (admin)
    const userNameMap = useMemo(() => {
        return new Map(users.map(u => [u.id, u.name]));
    }, [users]);

    const isLoading = logsLoading || projectsLoading;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}
                    </h1>
                    <p className="text-muted-foreground">
                        Here's what's happening with your work tracking
                    </p>
                </div>
                <Button asChild>
                    <Link to="/logs/create">
                        <IconPlus className="mr-2 h-4 w-4" />
                        Log Time
                    </Link>
                </Button>
            </div>

            {/* KPI Metrics */}
            <MetricCardGrid columns={4}>
                <MetricCard
                    title="Total Hours"
                    value={formatDuration(metrics.totalHours)}
                    change={metrics.hoursChange}
                    description="Hours logged this month"
                    subtitle="vs last 30 days"
                    icon={<IconClock className="h-5 w-5" />}
                    loading={isLoading}
                />
                <MetricCard
                    title="Active Projects"
                    value={metrics.activeProjects}
                    change={metrics.projectsChange}
                    description={`${projects.length} total projects`}
                    subtitle="Projects worked on"
                    icon={<IconFolder className="h-5 w-5" />}
                    loading={isLoading}
                />
                <MetricCard
                    title="Team Members"
                    value={metrics.activeUsers}
                    change={metrics.usersChange}
                    description="Active this month"
                    subtitle={isAdmin ? `${users.length} total members` : undefined}
                    icon={<IconUsers className="h-5 w-5" />}
                    loading={isLoading || usersLoading}
                />
                <MetricCard
                    title="Avg Hours/Day"
                    value={`${metrics.avgHoursPerDay.toFixed(1)}h`}
                    trend="neutral"
                    description="Average daily productivity"
                    subtitle="Work days with logs"
                    icon={<IconTrendingUp className="h-5 w-5" />}
                    loading={isLoading}
                />
            </MetricCardGrid>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Time Series Chart - Takes 2 columns */}
                <div className="md:col-span-2">
                    <TimeSeriesChart
                        title="Hours Logged"
                        description="Total hours logged over time"
                        data={timeSeriesData}
                        height={300}
                        loading={isLoading}
                    />
                </div>

                {/* Top Projects */}
                <TopProjects
                    data={projectChartData}
                    limit={5}
                    height={300}
                    loading={isLoading}
                />
            </div>

            {/* Recent Activity & Team Performance */}
            <div className="grid gap-4 md:grid-cols-2">
                <RecentActivity
                    logs={logs.slice(0, 10)}
                    projectNames={projectNameMap}
                    userNames={userNameMap}
                    showUser={isAdmin}
                    limit={5}
                    loading={isLoading}
                />

                {/* Team Performance (Admin) or Quick Actions */}
                {isAdmin ? (
                    <TeamPerformance
                        data={userChartData}
                        limit={8}
                        loading={isLoading || usersLoading}
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-card p-6">
                            <h3 className="text-base font-medium mb-4">Quick Actions</h3>
                            <div className="grid gap-2">
                                <Button variant="outline" className="justify-start" asChild>
                                    <Link to="/logs/create">
                                        <IconPlus className="mr-2 h-4 w-4" />
                                        Create New Log
                                    </Link>
                                </Button>
                                <Button variant="outline" className="justify-start" asChild>
                                    <Link to="/logs">
                                        <IconClock className="mr-2 h-4 w-4" />
                                        View All Logs
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Team Hours Tracking - Admin Only */}
            {isAdmin && (
                <TeamHoursSection
                    defaultTeamId={user?.team_id || null}
                    loading={logsLoading || usersLoading}
                />
            )}
        </div>
    );
}
