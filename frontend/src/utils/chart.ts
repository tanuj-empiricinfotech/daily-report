/**
 * Chart utility functions for data transformation
 * Following clean code principles - single responsibility
 */

import type { DailyLog } from '@/lib/api/types';
import { generateDateRange } from './analytics';

export interface ChartDataPoint {
    date: string;
    displayDate: string;
    value: number;
    [key: string]: string | number;
}

export interface TimeSeriesData {
    date: string;
    displayDate: string;
    hours: number;
    trackedHours: number;
    logCount: number;
}

/**
 * Transform logs into time series chart data
 */
export function transformLogsToTimeSeries(
    logs: DailyLog[],
    startDate: string,
    endDate: string
): TimeSeriesData[] {
    // Generate all dates in range
    const dates = generateDateRange(startDate, endDate);

    // Create a map for quick lookup
    const dataMap = new Map<string, TimeSeriesData>();

    // Initialize all dates with zero values
    for (const date of dates) {
        const d = new Date(date);
        dataMap.set(date, {
            date,
            displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            hours: 0,
            trackedHours: 0,
            logCount: 0,
        });
    }

    // Aggregate log data
    for (const log of logs) {
        const dateKey = typeof log.date === 'string'
            ? log.date.split('T')[0]
            : new Date(log.date).toISOString().split('T')[0];

        const existing = dataMap.get(dateKey);
        if (existing) {
            const actual = typeof log.actual_time_spent === 'string'
                ? parseFloat(log.actual_time_spent)
                : log.actual_time_spent;
            const tracked = typeof log.tracked_time === 'string'
                ? parseFloat(log.tracked_time)
                : log.tracked_time;

            existing.hours += actual;
            existing.trackedHours += tracked;
            existing.logCount++;
        }
    }

    // Convert to array and sort by date
    return Array.from(dataMap.values()).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

export interface ProjectChartData {
    name: string;
    hours: number;
    percentage: number;
    fill: string;
}

/**
 * Transform logs into project distribution chart data
 */
export function transformLogsToProjectChart(
    logs: DailyLog[],
    projectNames: Map<number, string>,
    colors: string[]
): ProjectChartData[] {
    // Aggregate by project
    const projectHours = new Map<number, number>();
    let totalHours = 0;

    for (const log of logs) {
        const hours = typeof log.actual_time_spent === 'string'
            ? parseFloat(log.actual_time_spent)
            : log.actual_time_spent;

        const existing = projectHours.get(log.project_id) || 0;
        projectHours.set(log.project_id, existing + hours);
        totalHours += hours;
    }

    // Convert to chart data
    const data: ProjectChartData[] = [];
    let colorIndex = 0;

    for (const [projectId, hours] of projectHours.entries()) {
        data.push({
            name: projectNames.get(projectId) || `Project ${projectId}`,
            hours: Math.round(hours * 10) / 10,
            percentage: totalHours > 0 ? Math.round((hours / totalHours) * 1000) / 10 : 0,
            fill: colors[colorIndex % colors.length],
        });
        colorIndex++;
    }

    // Sort by hours descending
    return data.sort((a, b) => b.hours - a.hours);
}

export interface UserChartData {
    name: string;
    hours: number;
    avatar?: string;
    fill: string;
}

/**
 * Transform logs into user performance chart data
 */
export function transformLogsToUserChart(
    logs: DailyLog[],
    userNames: Map<number, { name: string; avatar?: string }>,
    colors: string[]
): UserChartData[] {
    // Aggregate by user
    const userHours = new Map<number, number>();

    for (const log of logs) {
        const hours = typeof log.actual_time_spent === 'string'
            ? parseFloat(log.actual_time_spent)
            : log.actual_time_spent;

        const existing = userHours.get(log.user_id) || 0;
        userHours.set(log.user_id, existing + hours);
    }

    // Convert to chart data
    const data: UserChartData[] = [];
    let colorIndex = 0;

    for (const [userId, hours] of userHours.entries()) {
        const userInfo = userNames.get(userId);
        data.push({
            name: userInfo?.name || `User ${userId}`,
            hours: Math.round(hours * 10) / 10,
            avatar: userInfo?.avatar,
            fill: colors[colorIndex % colors.length],
        });
        colorIndex++;
    }

    // Sort by hours descending
    return data.sort((a, b) => b.hours - a.hours);
}

/**
 * Format chart tooltip value
 */
export function formatChartTooltip(value: number, name: string): string {
    if (name.toLowerCase().includes('hour')) {
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        if (hours === 0) return `${minutes}m`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    }

    if (name.toLowerCase().includes('percent')) {
        return `${value.toFixed(1)}%`;
    }

    return value.toLocaleString();
}

/**
 * Generate chart axis tick formatter
 */
export function getAxisTickFormatter(type: 'hours' | 'date' | 'number') {
    switch (type) {
        case 'hours':
            return (value: number) => `${value}h`;
        case 'date':
            return (value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            };
        default:
            return (value: number) => value.toLocaleString();
    }
}

/**
 * Calculate chart domain with padding
 */
export function calculateChartDomain(
    data: number[],
    padding = 0.1
): [number, number] {
    if (data.length === 0) return [0, 10];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || max || 1;

    return [
        Math.max(0, min - range * padding),
        max + range * padding,
    ];
}

/**
 * Responsive chart config
 */
export const responsiveChartConfig = {
    small: { height: 200, tickCount: 4 },
    medium: { height: 300, tickCount: 6 },
    large: { height: 400, tickCount: 8 },
};

/**
 * Get chart config based on container width
 */
export function getResponsiveChartConfig(width: number) {
    if (width < 400) return responsiveChartConfig.small;
    if (width < 800) return responsiveChartConfig.medium;
    return responsiveChartConfig.large;
}

/**
 * Default chart margins
 */
export const defaultChartMargins = {
    top: 10,
    right: 10,
    bottom: 20,
    left: 40,
};

/**
 * Chart animation config
 */
export const chartAnimationConfig = {
    duration: 500,
    easing: 'ease-out',
};
