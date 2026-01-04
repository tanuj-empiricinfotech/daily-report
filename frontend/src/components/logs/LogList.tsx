import { useMyLogs } from '@/lib/query/hooks/useLogs';
import { useMyProjects } from '@/lib/query/hooks/useProjects';
import { useDeleteLog } from '@/lib/query/hooks/useLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatTimeDisplay, sumTimeStrings } from '@/utils/time';
import { formatDateTime } from '@/utils/formatting';
import type { DailyLog } from '@/lib/api/types';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LogListProps {
  date: string;
  onEdit: (log: DailyLog) => void;
}

export function LogList({ date, onEdit }: LogListProps) {
  const { data: logs = [], isLoading } = useMyLogs(date);
  const { data: projects = [] } = useMyProjects();
  const deleteLog = useDeleteLog();

  const handleDelete = async (logId: number) => {
    try {
      await deleteLog.mutateAsync(logId);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No logs found for this date.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group logs by project
  const logsByProject = logs.reduce((acc, log) => {
    const projectId = log.project_id;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(log);
    return acc;
  }, {} as Record<number, DailyLog[]>);

  // Calculate totals for each project
  const projectTotals = Object.entries(logsByProject).reduce(
    (acc, [projectId, projectLogs]) => {
      acc[projectId] = {
        actualTime: sumTimeStrings(projectLogs.map(log => log.actual_time_spent)),
        trackedTime: sumTimeStrings(projectLogs.map(log => log.tracked_time)),
      };
      return acc;
    },
    {} as Record<string, { actualTime: number; trackedTime: number }>
  );

  return (
    <div className="space-y-6">
      {Object.entries(logsByProject).map(([projectId, projectLogs]) => {
        const project = projects.find((p) => p.id === parseInt(projectId, 10));
        const totals = projectTotals[projectId];

        return (
          <Card key={projectId} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{project?.name || `Project ${projectId}`}</CardTitle>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Actual: </span>
                    <span className="font-medium">
                      {formatTimeDisplay(totals.actualTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Tracked: </span>
                    <span className="font-medium">
                      {formatTimeDisplay(totals.trackedTime)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg bg-muted/30 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <p className="flex-1 text-sm">{log.task_description}</p>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(log)}
                        className="h-8 w-8"
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this log entry? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(log.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Actual Time</p>
                      <p className="font-medium">
                        {formatTimeDisplay(log.actual_time_spent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tracked Time</p>
                      <p className="font-medium">
                        {formatTimeDisplay(log.tracked_time)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDateTime(log.created_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
