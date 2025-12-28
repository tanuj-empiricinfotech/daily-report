import { useState } from 'react';
import { useTeamLogs } from '@/lib/query/hooks/useLogs';
import { useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDisplayDate, formatDateTime } from '@/utils/formatting';
import { formatDecimalHours } from '@/utils/time';

export function LogsViewer() {
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const [date, setDate] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const { data: logs = [], isLoading } = useTeamLogs(selectedTeamId, {
    date: date || undefined,
    userId: userId || undefined,
    projectId: projectId || undefined,
  });

  const { data: users = [] } = useUsersByTeam(selectedTeamId);
  const { data: projects = [] } = useProjects(selectedTeamId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <DatePicker
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              value={userId?.toString() || ''}
              onValueChange={(val) => setUserId(val ? parseInt(val, 10) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={projectId?.toString() || ''}
              onValueChange={(val) => setProjectId(val ? parseInt(val, 10) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle>{formatDisplayDate(log.date)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{log.task_description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Actual Time</p>
                  <p className="font-medium">{formatDecimalHours(log.actual_time_spent)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tracked Time</p>
                  <p className="font-medium">{formatDecimalHours(log.tracked_time)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Created: {formatDateTime(log.created_at)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

