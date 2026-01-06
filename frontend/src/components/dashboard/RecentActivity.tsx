/**
 * Recent Activity Component
 * Shows timeline of recent log entries
 */

import { Link } from 'react-router-dom';
import { IconClipboardList, IconClock, IconArrowRight } from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDuration, formatDateDisplay } from '@/utils/analytics';
import type { DailyLog } from '@/lib/api/types';

interface RecentActivityProps {
    /** Recent log entries */
    logs: DailyLog[];
    /** Project name lookup */
    projectNames?: Map<number, string>;
    /** User name lookup (for admin view) */
    userNames?: Map<number, string>;
    /** Show user info (admin view) */
    showUser?: boolean;
    /** Maximum items to show */
    limit?: number;
    /** Loading state */
    loading?: boolean;
    /** Additional className */
    className?: string;
}

export function RecentActivity({
    logs,
    projectNames = new Map(),
    userNames = new Map(),
    showUser = false,
    limit = 5,
    loading = false,
    className,
}: RecentActivityProps) {
    const displayLogs = logs.slice(0, limit);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <Card className={cn(className)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted shimmer" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-muted rounded shimmer" />
                                    <div className="h-3 w-1/2 bg-muted rounded shimmer" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/logs" className="text-muted-foreground hover:text-foreground">
                        View all
                        <IconArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>

            <CardContent>
                {displayLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            No recent activity
                        </p>
                        <Button variant="outline" size="sm" className="mt-4" asChild>
                            <Link to="/logs/create">Log your first task</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayLogs.map((log) => {
                            const projectName = projectNames.get(log.project_id) || 'Unknown Project';
                            const userName = userNames.get(log.user_id) || 'User';
                            const hours = typeof log.actual_time_spent === 'string'
                                ? parseFloat(log.actual_time_spent)
                                : log.actual_time_spent;
                            const logDate = typeof log.date === 'string'
                                ? log.date.split('T')[0]
                                : new Date(log.date).toISOString().split('T')[0];

                            return (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 group"
                                >
                                    {showUser ? (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {getInitials(userName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {showUser && (
                                                <span className="text-sm font-medium truncate">
                                                    {userName}
                                                </span>
                                            )}
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {projectName}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                            {log.task_description}
                                        </p>

                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <IconClock className="h-3 w-3" />
                                                {formatDuration(hours)}
                                            </span>
                                            <span>{formatDateDisplay(logDate, 'month')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
