/**
 * Top Projects Component
 * Bar chart showing most active projects by hours
 */

import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { generateChartColors } from '@/lib/theme';
import type { ProjectChartData } from '@/utils/chart';

interface TopProjectsProps {
    /** Project data */
    data: ProjectChartData[];
    /** Maximum projects to show */
    limit?: number;
    /** Chart height */
    height?: number;
    /** Loading state */
    loading?: boolean;
    /** Additional className */
    className?: string;
}

export function TopProjects({
    data,
    limit = 5,
    height = 200,
    loading = false,
    className,
}: TopProjectsProps) {
    const chartData = useMemo(() => {
        return data.slice(0, limit);
    }, [data, limit]);

    const colors = useMemo(() => generateChartColors(limit), [limit]);

    if (loading) {
        return (
            <Card className={cn(className)}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Top Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="bg-muted rounded shimmer"
                        style={{ height }}
                    />
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card className={cn(className)}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Top Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="flex items-center justify-center text-muted-foreground text-sm"
                        style={{ height }}
                    >
                        No project data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Top Projects</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="chart-container" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                        >
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                                tickFormatter={(value) => `${value}h`}
                            />

                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-foreground)', fontSize: 12 }}
                                width={100}
                                tickFormatter={(value) =>
                                    value.length > 12 ? `${value.slice(0, 12)}...` : value
                                }
                            />

                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;

                                    const data = payload[0].payload as ProjectChartData;

                                    return (
                                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                                            <p className="text-sm font-medium">{data.name}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Hours: <span className="font-medium text-foreground">
                                                    {data.hours.toFixed(1)}h
                                                </span>
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Share: <span className="font-medium text-foreground">
                                                    {data.percentage}%
                                                </span>
                                            </p>
                                        </div>
                                    );
                                }}
                            />

                            <Bar
                                dataKey="hours"
                                radius={[0, 4, 4, 0]}
                                maxBarSize={24}
                            >
                                {chartData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
