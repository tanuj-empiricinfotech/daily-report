/**
 * Team Performance Component
 * Displays team member performance metrics (Admin only)
 * Shows top performing team members by hours logged
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { generateChartColors } from '@/lib/theme';
import { getUserInitials } from '@/utils/analytics';
import type { UserChartData } from '@/utils/chart';

const MIN_CHART_HEIGHT = 200;
const BAR_HEIGHT = 36;
const BAR_MAX_SIZE = 28;
const TOP_USERS_LIMIT = 8;

interface TeamPerformanceProps {
  /** User performance data */
  data: UserChartData[];
  /** Maximum users to show */
  limit?: number;
  /** Chart height (auto-calculated if not provided) */
  height?: number;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

export function TeamPerformance({
  data,
  limit = TOP_USERS_LIMIT,
  height,
  loading = false,
  className,
}: TeamPerformanceProps) {
  const chartData = useMemo(() => {
    return data.slice(0, limit);
  }, [data, limit]);

  const colors = useMemo(() => generateChartColors(limit), [limit]);

  const chartHeight = useMemo(() => {
    if (height) return height;
    const calculatedHeight = chartData.length * BAR_HEIGHT;
    return Math.max(MIN_CHART_HEIGHT, calculatedHeight);
  }, [height, chartData.length]);

  if (loading) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="bg-muted rounded shimmer"
            style={{ height: chartHeight }}
          />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground text-sm"
            style={{ height: chartHeight }}
          >
            No team data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Team Performance
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="chart-container" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
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
                tick={false}
                width={120}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const data = payload[0].payload as UserChartData;

                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(data.name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{data.name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hours: <span className="font-medium text-foreground">
                          {data.hours.toFixed(1)}h
                        </span>
                      </p>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey="hours"
                radius={[0, 4, 4, 0]}
                maxBarSize={BAR_MAX_SIZE}
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

        {/* User Labels - outside the chart for better readability */}
        <div className="mt-4 space-y-2">
          {chartData.map((user, index) => (
            <div
              key={user.name}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate flex-1">{user.name}</span>
              <span className="text-muted-foreground font-medium flex-shrink-0">
                {user.hours.toFixed(1)}h
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
