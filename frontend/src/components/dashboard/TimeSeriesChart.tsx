/**
 * Time Series Chart Component
 * Area chart for displaying time-based data using Recharts
 */

import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TimeSeriesData } from '@/utils/chart';

interface TimeSeriesChartProps {
    /** Chart title */
    title?: string;
    /** Chart description */
    description?: string;
    /** Chart data */
    data: TimeSeriesData[];
    /** Currently selected time range */
    selectedRange?: '7d' | '30d' | '3m';
    /** Callback when range changes */
    onRangeChange?: (range: '7d' | '30d' | '3m') => void;
    /** Show range selector */
    showRangeSelector?: boolean;
    /** Chart height */
    height?: number;
    /** Additional className */
    className?: string;
    /** Loading state */
    loading?: boolean;
}

const timeRanges = [
    { value: '3m' as const, label: 'Last 3 months' },
    { value: '30d' as const, label: 'Last 30 days' },
    { value: '7d' as const, label: 'Last 7 days' },
];

export function TimeSeriesChart({
    title = 'Total Hours',
    description,
    data,
    selectedRange = '30d',
    onRangeChange,
    showRangeSelector = true,
    height = 300,
    className,
    loading = false,
}: TimeSeriesChartProps) {
    const [activeRange, setActiveRange] = useState(selectedRange);

    const handleRangeChange = (range: '7d' | '30d' | '3m') => {
        setActiveRange(range);
        onRangeChange?.(range);
    };

    // Calculate max value for Y axis domain
    const maxValue = useMemo(() => {
        if (!data.length) return 10;
        const max = Math.max(...data.map(d => d.hours));
        return Math.ceil(max * 1.1); // Add 10% padding
    }, [data]);

    if (loading) {
        return (
            <Card className={cn(className)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <div className="h-5 w-32 bg-muted rounded shimmer" />
                        <div className="h-4 w-48 bg-muted rounded shimmer" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        className="bg-muted rounded shimmer"
                        style={{ height: height }}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </div>

                {showRangeSelector && (
                    <div className="flex items-center gap-1">
                        {timeRanges.map((range) => (
                            <Button
                                key={range.value}
                                variant={activeRange === range.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleRangeChange(range.value)}
                                className="text-xs"
                            >
                                {range.label}
                            </Button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent>
                <div className="chart-container" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="0%"
                                        stopColor="var(--color-chart-1)"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-chart-1)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            {/* Grid */}
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--color-border)"
                                vertical={false}
                            />

                            {/* X Axis */}
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                                dy={10}
                                interval="preserveStartEnd"
                                minTickGap={30}
                            />

                            {/* Y Axis */}
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                                dx={-10}
                                domain={[0, maxValue]}
                                tickFormatter={(value) => `${value}h`}
                            />

                            {/* Tooltip */}
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;

                                    const data = payload[0].payload as TimeSeriesData;

                                    return (
                                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                                            <p className="text-sm font-medium">{label}</p>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-sm text-muted-foreground">
                                                    Hours: <span className="font-medium text-foreground">
                                                        {data.hours.toFixed(1)}h
                                                    </span>
                                                </p>
                                                {data.logCount > 0 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Logs: <span className="font-medium text-foreground">
                                                            {data.logCount}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }}
                            />

                            {/* Area */}
                            <Area
                                type="monotone"
                                dataKey="hours"
                                stroke="var(--color-chart-1)"
                                strokeWidth={2}
                                fill="url(#hoursGradient)"
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: 'var(--color-chart-1)',
                                    stroke: 'var(--color-background)',
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
