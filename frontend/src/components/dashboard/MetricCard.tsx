/**
 * Metric Card Component
 * Displays KPI metrics with trend indicators
 * Following shadcn dashboard design pattern
 */

import { type ReactNode } from 'react';
import { IconMinus, IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getTrendFromChange, type TrendType } from '@/lib/theme';
import { formatTrendPercentage } from '@/utils/analytics';

interface MetricCardProps {
    /** Title of the metric */
    title: string;
    /** Main value to display */
    value: string | number;
    /** Optional change percentage */
    change?: number;
    /** Trend direction (auto-calculated from change if not provided) */
    trend?: TrendType;
    /** Description text below the trend */
    description?: string;
    /** Subtitle text */
    subtitle?: string;
    /** Icon to display */
    icon?: ReactNode;
    /** Additional className */
    className?: string;
    /** Loading state */
    loading?: boolean;
}

export function MetricCard({
    title,
    value,
    change,
    trend: trendProp,
    description,
    subtitle,
    icon,
    className,
    loading = false,
}: MetricCardProps) {
    // Calculate trend from change if not provided
    const trend = trendProp ?? (change !== undefined ? getTrendFromChange(change) : 'neutral');

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <IconArrowUpRight className="h-4 w-4" />;
            case 'down':
                return <IconArrowDownRight className="h-4 w-4" />;
            default:
                return <IconMinus className="h-4 w-4" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-success';
            case 'down':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <Card className={cn('metric-card', className)}>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-muted rounded shimmer" />
                        <div className="h-8 w-32 bg-muted rounded shimmer" />
                        <div className="h-4 w-40 bg-muted rounded shimmer" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('metric-card hover-lift', className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        {/* Title with optional change indicator */}
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            {change !== undefined && (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-0.5 text-xs font-medium',
                                        getTrendColor()
                                    )}
                                >
                                    {getTrendIcon()}
                                    {formatTrendPercentage(Math.abs(change))}
                                </span>
                            )}
                        </div>

                        {/* Main Value */}
                        <p className="text-2xl font-bold tracking-tight">{value}</p>

                        {/* Description with trend context */}
                        {description && (
                            <p className={cn('text-sm flex items-center gap-1', getTrendColor())}>
                                {description}
                                {trend !== 'neutral' && (
                                    <IconArrowUpRight
                                        className={cn(
                                            'h-3 w-3',
                                            trend === 'down' && 'rotate-90'
                                        )}
                                    />
                                )}
                            </p>
                        )}

                        {/* Subtitle */}
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>

                    {/* Optional Icon */}
                    {icon && (
                        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Metric Card Grid
 * Helper component for laying out multiple metric cards
 */
interface MetricCardGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4;
    className?: string;
}

export function MetricCardGrid({
    children,
    columns = 4,
    className
}: MetricCardGridProps) {
    const gridCols = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {children}
        </div>
    );
}
