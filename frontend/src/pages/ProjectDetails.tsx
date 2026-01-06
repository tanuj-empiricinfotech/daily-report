/**
 * Project Details Page
 * View detailed information about a project
 * Admin-only page
 */

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconClock, IconUsers, IconFolder } from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useTeamLogs } from '@/lib/query/hooks/useLogs';
import { useUsers } from '@/lib/query/hooks/useUsers';
import { formatDuration } from '@/utils/analytics';
import { parseTimeInput } from '@/utils/time';
import type { DailyLog } from '@/lib/api/types';

/**
 * Get user initials for avatar
 */
function getUserInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = useProjects(user?.team_id || null);
  const { data: teamLogs = [], isLoading: logsLoading } = useTeamLogs(
    user?.team_id || null,
    {}
  );
  const { data: users = [], isLoading: usersLoading } = useUsers(isAdmin);

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

  // Find the project
  const project = projects.find((p) => p.id === parseInt(id || '0'));

  // Filter logs for this project
  const projectLogs = useMemo(() => {
    if (!project) return [];
    return teamLogs.filter((log: DailyLog) => log.project_id === project.id);
  }, [teamLogs, project]);

  // Calculate total hours
  const totalHours = useMemo(() => {
    return projectLogs.reduce((sum: number, log: DailyLog) => {
      return sum + parseTimeInput(log.actual_time_spent);
    }, 0);
  }, [projectLogs]);

  // Calculate hours by user
  const hoursByUser = useMemo(() => {
    const userHoursMap = new Map<number, number>();

    projectLogs.forEach((log: DailyLog) => {
      const hours = parseTimeInput(log.actual_time_spent);
      const currentHours = userHoursMap.get(log.user_id) || 0;
      userHoursMap.set(log.user_id, currentHours + hours);
    });

    // Convert to array and add user names
    const hoursList = Array.from(userHoursMap.entries()).map(([userId, hours]) => {
      const userObj = users.find((u) => u.id === userId);
      return {
        userId,
        userName: userObj?.name || 'Unknown User',
        hours,
      };
    });

    // Sort by hours descending
    return hoursList.sort((a, b) => b.hours - a.hours);
  }, [projectLogs, users]);

  const isLoading = projectsLoading || logsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <ErrorDisplay error="Project not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/projects')}>
        <IconArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>

      {/* Project Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <IconFolder className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-2">
            {project.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline">
              Created {new Date(project.created_at).toLocaleDateString()}
            </Badge>
            <Badge variant="outline">
              {projectLogs.length} {projectLogs.length === 1 ? 'log entry' : 'log entries'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Logged</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalHours)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {hoursByUser.length} {hoursByUser.length === 1 ? 'member' : 'members'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursByUser.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Contributors to this project
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hours by User */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Logged by User</CardTitle>
          <CardDescription>
            Breakdown of time logged by each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hoursByUser.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hours logged for this project yet
            </div>
          ) : (
            <div className="space-y-4">
              {hoursByUser.map((userHours) => (
                <div
                  key={userHours.userId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(userHours.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userHours.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {((userHours.hours / totalHours) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatDuration(userHours.hours)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {projectLogs.filter((log: DailyLog) => log.user_id === userHours.userId).length} entries
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
