import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { DailyLog, Project, User } from '@/lib/api/types';
import { formatDisplayDate, normalizeDateForComparison } from '@/utils/formatting';
import { formatDecimalHours } from '@/utils/time';
import { IconEdit } from '@tabler/icons-react';

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
    navigate(`/logs/edit/${log.id}`);
    onEdit?.();
  }, [navigate, onEdit]);

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
            let rowIndex = 0;
            return group.projects.map((project) => {
              const projectRowSpan = project.logs.length;
              return project.logs.map((log, taskIndex) => {
                const isFirstRowInDate = rowIndex === 0;
                const isFirstTaskInProject = taskIndex === 0;
                rowIndex++;
                
                return (
                  <TableRow 
                    key={log.id} 
                    className={isFirstRowInDate ? 'border-t-2 border-t-border' : ''}
                  >
                    {isFirstRowInDate && (
                      <>
                        <TableCell
                          rowSpan={group.totalRows}
                          className="align-middle font-medium border-r border-r-border"
                        >
                          {formatDisplayDate(group.date)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell 
                            rowSpan={group.totalRows} 
                            className="align-middle border-r border-r-border"
                          >
                            {getUserName(log.user_id)}
                          </TableCell>
                        )}
                      </>
                    )}
                    {isFirstTaskInProject && (
                      <TableCell
                        rowSpan={projectRowSpan}
                        className="align-middle font-medium border-r border-r-border bg-muted/30"
                      >
                        {project.projectName}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="max-w-md truncate" title={log.task_description}>
                        {log.task_description}
                      </div>
                    </TableCell>
                    <TableCell>{formatDecimalHours(log.actual_time_spent)}</TableCell>
                    <TableCell>{formatDecimalHours(log.tracked_time)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(log)}
                      >
                        <IconEdit className="size-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              });
            }).flat();
          })}
        </TableBody>
      </Table>
    </div>
  );
}
