/**
 * Analytics utility functions
 * Following DRY principles - centralized analytics calculations
 */

import type { DailyLog } from '@/lib/api/types';
import { parseTimeInput } from '@/utils/time';

/**
 * Calculate percentage change between two values
 */
export function calculateTrend(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
}

/**
 * Format a number as a percentage with sign
 */
export function formatTrendPercentage(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format hours to a readable duration string
 * @example formatDuration(2.5) => "2h 30m"
 */
export function formatDuration(hours: number): string {
    if (hours === 0) return '0h';

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (wholeHours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${wholeHours}h`;
    }

    return `${wholeHours}h ${minutes}m`;
}

/**
 * Format hours as decimal with precision
 */
export function formatHoursDecimal(hours: number, precision = 1): string {
    return hours.toFixed(precision);
}

/**
 * Aggregate logs by date
 */
export function aggregateByDate(
    logs: DailyLog[]
): Map<string, { totalHours: number; logs: DailyLog[] }> {
    const grouped = new Map<string, { totalHours: number; logs: DailyLog[] }>();

    for (const log of logs) {
        const dateKey = typeof log.date === 'string'
            ? log.date.split('T')[0]
            : new Date(log.date).toISOString().split('T')[0];

        const existing = grouped.get(dateKey) || { totalHours: 0, logs: [] };
        const hours = typeof log.actual_time_spent === 'string'
            ? parseTimeInput(log.actual_time_spent)
            : log.actual_time_spent;

        existing.totalHours += hours;
        existing.logs.push(log);
        grouped.set(dateKey, existing);
    }

    return grouped;
}

/**
 * Aggregate logs by project
 */
export function aggregateByProject(
    logs: DailyLog[]
): Map<number, { totalHours: number; logs: DailyLog[] }> {
    const grouped = new Map<number, { totalHours: number; logs: DailyLog[] }>();

    for (const log of logs) {
        const projectId = log.project_id;
        const existing = grouped.get(projectId) || { totalHours: 0, logs: [] };
        const hours = typeof log.actual_time_spent === 'string'
            ? parseTimeInput(log.actual_time_spent)
            : log.actual_time_spent;

        existing.totalHours += hours;
        existing.logs.push(log);
        grouped.set(projectId, existing);
    }

    return grouped;
}

/**
 * Aggregate logs by user
 */
export function aggregateByUser(
    logs: DailyLog[]
): Map<number, { totalHours: number; logs: DailyLog[] }> {
    const grouped = new Map<number, { totalHours: number; logs: DailyLog[] }>();

    for (const log of logs) {
        const userId = log.user_id;
        const existing = grouped.get(userId) || { totalHours: 0, logs: [] };
        const hours = typeof log.tracked_time === 'string'
            ? parseTimeInput(log.tracked_time)
            : log.tracked_time;

        existing.totalHours += hours;
        existing.logs.push(log);
        grouped.set(userId, existing);
    }

    return grouped;
}

/**
 * Calculate total hours from logs
 */
export function calculateTotalHours(logs: DailyLog[]): number {
    return logs.reduce((total, log) => {
        const hours = typeof log.actual_time_spent === 'string'
            ? parseTimeInput(log.actual_time_spent)
            : log.actual_time_spent;
        return total + hours;
    }, 0);
}

/**
 * Calculate tracked vs actual variance
 */
export function calculateTimeVariance(logs: DailyLog[]): {
    actualTotal: number;
    trackedTotal: number;
    variance: number;
    variancePercent: number;
} {
    let actualTotal = 0;
    let trackedTotal = 0;

    for (const log of logs) {
        const actual = typeof log.actual_time_spent === 'string'
            ? parseTimeInput(log.actual_time_spent)
            : log.actual_time_spent;
        const tracked = typeof log.tracked_time === 'string'
            ? parseTimeInput(log.tracked_time)
            : log.tracked_time;

        actualTotal += actual;
        trackedTotal += tracked;
    }

    const variance = actualTotal - trackedTotal;
    const variancePercent = trackedTotal > 0
        ? ((actualTotal - trackedTotal) / trackedTotal) * 100
        : 0;

    return { actualTotal, trackedTotal, variance, variancePercent };
}

/**
 * Get date range strings for filtering
 * Supports multiple time range formats
 */
export function getDateRange(range: '1d' | '7d' | '30d' | '90d' | '180d' | '365d' | '3m' | 'custom'): {
    startDate: string;
    endDate: string;
} {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
        case '1d':
            startDate.setDate(startDate.getDate() - 1);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '180d':
            startDate.setDate(startDate.getDate() - 180);
            break;
        case '365d':
            startDate.setDate(startDate.getDate() - 365);
            break;
        case '3m':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    };
}

/**
 * Generate array of dates between start and end
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: string | Date, format: 'short' | 'long' | 'month' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
        case 'long':
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'month':
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        default:
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
    }
}

/**
 * Calculate completion rate (placeholder - adjust based on business logic)
 */
export function calculateCompletionRate(
    completedTasks: number,
    totalTasks: number
): number {
    if (totalTasks === 0) return 0;
    return (completedTasks / totalTasks) * 100;
}

/**
 * Get top N items by count
 */
export function getTopItems<T>(
    items: T[],
    getKey: (item: T) => string | number,
    limit = 5
): { key: string | number; count: number; items: T[] }[] {
    const grouped = new Map<string | number, { count: number; items: T[] }>();

    for (const item of items) {
        const key = getKey(item);
        const existing = grouped.get(key) || { count: 0, items: [] };
        existing.count++;
        existing.items.push(item);
        grouped.set(key, existing);
    }

    return Array.from(grouped.entries())
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Calculate average hours per day
 */
export function calculateAverageHoursPerDay(
    logs: DailyLog[],
    days?: number
): number {
    const totalHours = calculateTotalHours(logs);
    const uniqueDays = new Set(logs.map(log => {
        const date = typeof log.date === 'string'
            ? log.date.split('T')[0]
            : new Date(log.date).toISOString().split('T')[0];
        return date;
    })).size;

    const divisor = days || uniqueDays || 1;
    return totalHours / divisor;
}

/**
 * Get current date in YYYY-MM-DD format (local timezone)
 * Utility for default date in filters
 */
export function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get user initials for avatar fallback
 * Extracted from TeamPerformance component to follow DRY principle
 * @example getUserInitials("John Doe") => "JD"
 * @example getUserInitials("Alice") => "AL"
 */
export function getUserInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
