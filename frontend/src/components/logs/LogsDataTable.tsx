import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DailyLog, Project, User } from '@/lib/api/types';
import { isDateInPast } from '@/utils/date';
import { formatDisplayDate, normalizeDateForComparison } from '@/utils/formatting';
import { formatTimeDisplay, sumTimeStrings } from '@/utils/time';
import { IconEdit, IconLock } from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface LogsDataTableProps {
  logs: DailyLog[];
  projects: Project[];
  users?: User[];
  isAdmin?: boolean;
  isLoading?: boolean;
  onEdit?: () => void;
}

export function LogsDataTable({
  logs,
  projects,
  users = [],
  isAdmin = false,
  isLoading = false,
  onEdit,
}: LogsDataTableProps) {
  const navigate = useNavigate();

  const getProjectName = useCallback((projectId: number): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  }, [projects]);

  const getUserName = useCallback((userId: number): string => {
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Unknown User';
  }, [users]);

  const handleEdit = useCallback((log: DailyLog) => {
    // Members cannot edit past logs
    if (!isAdmin && isDateInPast(log.date)) {
      return;
    }
    navigate(`/logs/edit/${log.id}`);
    onEdit?.();
  }, [navigate, onEdit, isAdmin]);

  const groupedLogs = useMemo(() => {
    const grouped = new Map<string, Map<number, DailyLog[]>>();

    logs.forEach((log) => {
      const dateKey = normalizeDateForComparison(log.date);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, new Map());
      }
      const dateGroup = grouped.get(dateKey)!;
      if (!dateGroup.has(log.project_id)) {
        dateGroup.set(log.project_id, []);
      }
      dateGroup.get(log.project_id)!.push(log);
    });

    // Convert to array structure: date -> projects -> tasks
    return Array.from(grouped.entries())
      .map(([date, projectMap]) => {
        const projects = Array.from(projectMap.entries()).map(([projectId, projectLogs]) => ({
          projectId,
          projectName: getProjectName(projectId),
          logs: projectLogs.sort((a, b) =>
            a.task_description.localeCompare(b.task_description)
          ),
        })).sort((a, b) => a.projectName.localeCompare(b.projectName));

        return {
          date,
          projects,
          totalRows: projects.reduce((sum, p) => sum + p.logs.length, 0),
        };
      })
      .sort((a, b) => {
        // Sort dates descending (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [logs, getProjectName]);

  /**
   * Calculate total actual time and tracked time across all logs
   * Following clean code principles - extracted calculation into separate memoized hook
   */
  const totals = useMemo(() => {
    return {
      actualTime: sumTimeStrings(logs.map(log => log.actual_time_spent)),
      trackedTime: sumTimeStrings(logs.map(log => log.tracked_time)),
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (groupedLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No logs found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%]">Date</TableHead>
            {isAdmin && <TableHead className="w-[15%]">User</TableHead>}
            <TableHead className="w-[20%]">Project</TableHead>
            <TableHead className="w-[35%]">Task Description</TableHead>
            <TableHead className="w-[10%]">Actual Time</TableHead>
            <TableHead className="w-[10%]">Tracked Time</TableHead>
            <TableHead className="w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedLogs.map((group) => {
            // Flatten all logs for this date group while maintaining order
            const flattenedLogs: Array<{ log: DailyLog; projectId: number; projectName: string }> = [];
            group.projects.forEach((project) => {
              project.logs.forEach((log) => {
                flattenedLogs.push({
                  log,
                  projectId: project.projectId,
                  projectName: project.projectName,
                });
              });
            });

            // Calculate user row spans for consecutive logs with same user_id
            const userRowSpans = new Map<number, number>();
            let currentUserId: number | null = null;
            let currentUserStartIndex = 0;

            flattenedLogs.forEach((item, index) => {
              if (item.log.user_id !== currentUserId) {
                // End of previous user group, set rowSpan
                if (currentUserId !== null) {
                  userRowSpans.set(currentUserStartIndex, index - currentUserStartIndex);
                }
                // Start new user group
                currentUserId = item.log.user_id;
                currentUserStartIndex = index;
              }
            });
            // Set rowSpan for last user group
            if (currentUserId !== null) {
              userRowSpans.set(currentUserStartIndex, flattenedLogs.length - currentUserStartIndex);
            }

            // Calculate project row spans
            const projectRowSpans = new Map<number, number>();
            let currentProjectId: number | null = null;
            let currentProjectStartIndex = 0;

            flattenedLogs.forEach((item, index) => {
              if (item.projectId !== currentProjectId) {
                if (currentProjectId !== null) {
                  projectRowSpans.set(currentProjectStartIndex, index - currentProjectStartIndex);
                }
                currentProjectId = item.projectId;
                currentProjectStartIndex = index;
              }
            });
            if (currentProjectId !== null) {
              projectRowSpans.set(currentProjectStartIndex, flattenedLogs.length - currentProjectStartIndex);
            }

            return flattenedLogs.map((item, index) => {
              const { log, projectName } = item;
              const isFirstRowInDate = index === 0;
              const isFirstRowForUser = userRowSpans.has(index);
              const isFirstRowForProject = projectRowSpans.has(index);
              const userRowSpan = userRowSpans.get(index) || 1;
              const projectRowSpan = projectRowSpans.get(index) || 1;

              return (
                <TableRow
                  key={log.id}
                  className={isFirstRowInDate ? 'border-t-2 border-t-border' : ''}
                >
                  {isFirstRowInDate && (
                    <TableCell
                      rowSpan={flattenedLogs.length}
                      className="align-middle font-medium border-r border-r-border"
                    >
                      {formatDisplayDate(group.date)}
                    </TableCell>
                  )}
                  {isAdmin && isFirstRowForUser && (
                    <TableCell
                      rowSpan={userRowSpan}
                      className="align-middle border-r border-r-border"
                    >
                      {getUserName(log.user_id)}
                    </TableCell>
                  )}
                  {isFirstRowForProject && (
                    <TableCell
                      rowSpan={projectRowSpan}
                      className="align-middle font-medium border-r border-r-border bg-muted/30"
                    >
                      {projectName}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="max-w-md truncate" title={log.task_description}>
                      {log.task_description}
                    </div>
                  </TableCell>
                  <TableCell>{formatTimeDisplay(log.actual_time_spent)}</TableCell>
                  <TableCell>{formatTimeDisplay(log.tracked_time)}</TableCell>
                  <TableCell>
                    {!isAdmin && isDateInPast(log.date) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        title="Cannot edit past logs"
                      >
                        <IconLock className="size-4 mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(log)}
                      >
                        <IconEdit className="size-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            });
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={isAdmin ? 4 : 3}
              className="text-right font-semibold"
            >
              Total:
            </TableCell>
            <TableCell className="font-semibold">
              {formatTimeDisplay(totals.actualTime)}
            </TableCell>
            <TableCell className="font-semibold">
              {formatTimeDisplay(totals.trackedTime)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
