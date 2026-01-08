/**
 * Team Hours Table Component
 * Displays team member hours for a selected date in a sortable table
 * Following Clean Code principles - DRY, single responsibility, type safety
 */

import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { aggregateByUser, formatDuration, getUserInitials } from '@/utils/analytics';
import type { DailyLog, User, Project } from '@/lib/api/types';
import type { TeamHoursRow } from '@/types/dashboard';

interface TeamHoursTableProps {
  /** Team logs for selected date */
  logs: DailyLog[];
  /** All users in team */
  users: User[];
  /** All projects in team */
  projects: Project[];
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Column definitions for team hours table
 * Following Clean Code principle - clear, descriptive configuration
 */
const columns: Column<TeamHoursRow>[] = [
  {
    id: 'user',
    header: 'Team Member',
    enableSorting: true,
    accessorFn: (row) => row.userName,
    cell: (row) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getUserInitials(row.userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{row.userName}</span>
          <span className="text-xs text-muted-foreground">{row.userEmail}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'role',
    header: 'Role',
    accessorFn: (row) => row.role,
    enableSorting: true,
    cell: (row) => (
      <Badge variant={row.role === 'admin' ? 'default' : 'secondary'}>
        {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
      </Badge>
    ),
  },
  {
    id: 'projects',
    header: 'Projects',
    accessorFn: (row) => row.projectsCount,
    enableSorting: true,
    cell: (row) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.projectsCount} project{row.projectsCount !== 1 ? 's' : ''}</span>
        {row.projectsList && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={row.projectsList}>
            {row.projectsList}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'logs',
    header: 'Entries',
    accessorFn: (row) => row.logsCount,
    enableSorting: true,
    align: 'center',
  },
  {
    id: 'hours',
    header: 'Total Hours',
    accessorFn: (row) => row.totalHours,
    enableSorting: true,
    align: 'right',
    cell: (row) => (
      <span className="font-medium text-lg">
        {formatDuration(row.totalHours)}
      </span>
    ),
  },
];

/**
 * TeamHoursTable Component
 * Transforms log data into table rows and renders using DataTable
 */
export function TeamHoursTable({
  logs,
  users,
  projects,
  loading = false,
  className,
}: TeamHoursTableProps) {
  // Create lookup maps for efficient access (O(1) instead of O(n))
  // Following performance best practices
  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  // Transform logs into table rows
  // Using useMemo to prevent recalculation on every render
  const tableData = useMemo(() => {
    // Aggregate logs by user (reusing existing utility)
    const userAggregates = aggregateByUser(logs);

    // Transform aggregated data into table rows
    return Array.from(userAggregates.entries())
      .map(([userId, data]) => {
        const user = userMap.get(userId);

        // Get unique projects for this user
        const userProjects = new Set(data.logs.map((log) => log.project_id));

        return {
          userId,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
          role: user?.role || 'member',
          projectsCount: userProjects.size,
          projectsList: Array.from(userProjects)
            .map((pid) => projectMap.get(pid)?.name)
            .filter(Boolean)
            .join(', '),
          totalHours: data.totalHours,
          logsCount: data.logs.length,
        } as TeamHoursRow;
      })
      // Sort by total hours descending (top performers first)
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [logs, userMap, projectMap]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  // Empty state
  if (tableData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hours logged for the selected date.</p>
      </div>
    );
  }

  // Render table with sorting and pagination
  return (
    <DataTable
      data={tableData}
      columns={columns}
      enablePagination={true}
      pageSize={10}
      getRowId={(row) => row.userId.toString()}
      emptyMessage="No team members found with logged hours."
      className={className}
    />
  );
}
