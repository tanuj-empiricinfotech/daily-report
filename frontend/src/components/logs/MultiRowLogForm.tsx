import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Project, CreateLogDto, DailyLog } from '@/lib/api/types';
import { formatDate } from '@/utils/formatting';
import { istToIso } from '@/utils/date';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/lib/query/hooks/useUsers';
import { useUsersWithProjectsByTeam } from '@/lib/query/hooks/useUsers';
import type { UserWithProjectsAndTeam } from '@/lib/api/types';

/**
 * Normalizes time input to HH:MM format
 * - "8" → "8:00"
 * - "3:30" → "3:30"
 * - "" → "0:00"
 */
const normalizeTimeInput = (input: string): string => {
  const trimmed = input.trim();

  // Empty input
  if (!trimmed) return '0:00';

  // Already in HH:MM format
  if (trimmed.includes(':')) {
    return trimmed;
  }

  // Single number - convert to hours
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 0) {
    return `${num}:00`;
  }

  return trimmed;
};

/**
 * Validates time format and returns error message if invalid
 */
const validateTimeFormat = (input: string): string | undefined => {
  const trimmed = input.trim();

  // Empty is valid
  if (!trimmed || trimmed === '0:00') return undefined;

  // Must contain colon for HH:MM format
  if (!trimmed.includes(':')) {
    // Check if it's a valid number (will be converted on blur)
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 0) {
      return 'Please enter a valid time (e.g., 3:30 or 3)';
    }
    return undefined; // Valid number, will be converted on blur
  }

  const parts = trimmed.split(':');
  if (parts.length !== 2) {
    return 'Invalid time format. Use HH:MM (e.g., 3:30)';
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return 'Invalid time. Hours and minutes must be numbers';
  }

  if (hours < 0) {
    return 'Hours cannot be negative';
  }

  if (minutes < 0) {
    return 'Minutes cannot be negative';
  }

  if (minutes >= 60) {
    return 'Invalid time. Minutes must be less than 60';
  }

  return undefined;
};

interface LogRow {
  id: string;
  projectId: number | '';
  taskDescription: string;
  actualTimeSpent: string;
  trackedTime: string;
  logId?: number;
}

interface MultiRowLogFormProps {
  onSubmit: (data: CreateLogDto[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  projects: Project[];
  error?: Error | null;
  initialData?: DailyLog[];
}

export function MultiRowLogForm({
  onSubmit,
  onCancel,
  isLoading = false,
  projects,
  error,
  initialData,
}: MultiRowLogFormProps) {
  const { isAdmin, user } = useAuth();
  const { data: users = [] } = useUsers(isAdmin);

  // Fetch users with their projects for admin user selection
  // If admin has no team_id, they should still be able to see all users
  const teamId = user?.team_id ?? null;
  const { data: usersWithProjects = [], isLoading: isLoadingUsers } = useUsersWithProjectsByTeam(teamId);

  // For admins: use users with their assigned projects if available (from team data)
  // As a fallback (admin with no team), use all users with all projects
  const availableUsers = React.useMemo(() => {
    // If we have team data with users and their projects, use it
    if (usersWithProjects.length > 0) {
      return usersWithProjects;
    }

    // Fallback for admins without team data: show all users with all available projects
    // This means when an admin selects a user, they'll see all projects (not filtered by user)
    if (isAdmin && users.length > 0) {
      return users.map(u => ({
        ...u,
        team_name: null,
        projects: projects, // All projects available
      }));
    }

    return [];
  }, [isAdmin, usersWithProjects, users, projects]);

  // State for selected user (admin only, when creating logs for others)
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);

  const [date, setDate] = React.useState<string>(
    initialData && initialData.length > 0 ? formatDate(initialData[0].date) : formatDate(new Date())
  );
  const [rows, setRows] = React.useState<LogRow[]>(() => {
    if (initialData && initialData.length > 0) {
      return initialData.map((log, index) => ({
        id: `log-${log.id}-${index}`,
        projectId: log.project_id,
        taskDescription: log.task_description,
        actualTimeSpent: log.actual_time_spent || '0:00',
        trackedTime: log.tracked_time || '0:00',
        logId: log.id,
      }));
    }
    return [{ id: Date.now().toString(), projectId: '', taskDescription: '', actualTimeSpent: '0:00', trackedTime: '0:00' }];
  });

  React.useEffect(() => {
    if (initialData && initialData.length > 0) {
      setDate(formatDate(initialData[0].date));
      setRows(
        initialData.map((log, index) => ({
          id: `log-${log.id}-${index}`,
          projectId: log.project_id,
          taskDescription: log.task_description,
          actualTimeSpent: log.actual_time_spent || '0:00',
          trackedTime: log.tracked_time || '0:00',
          logId: log.id,
        }))
      );
    }
  }, [initialData]);

  // Filter projects based on selected user (for admins creating logs for others)
  const filteredProjects = React.useMemo(() => {
    // If no user is selected or not admin, use all projects passed from parent
    if (!isAdmin || !selectedUserId || initialData) {
      return projects;
    }

    // Find the selected user and return their assigned projects
    const selectedUser = availableUsers.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      return [];
    }

    return selectedUser.projects;
  }, [isAdmin, selectedUserId, availableUsers, projects, initialData]);

  const [validationErrors, setValidationErrors] = React.useState<{
    date?: string;
    user?: string;
    rows?: Record<string, Record<string, string>>;
    general?: string;
  }>({});

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const newRow: LogRow = {
      id: Date.now().toString(),
      projectId: lastRow?.projectId || '',
      taskDescription: '',
      actualTimeSpent: '0:00',
      trackedTime: '0:00',
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
      // Clear validation errors for removed row
      const newErrors = { ...validationErrors };
      if (newErrors.rows?.[id]) {
        delete newErrors.rows[id];
        setValidationErrors(newErrors);
      }
    }
  };

  const updateRow = (id: string, updates: Partial<LogRow>) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, ...updates } : row)));
    // Clear validation errors for this row when user makes changes
    const newErrors = { ...validationErrors };
    if (newErrors.rows?.[id]) {
      delete newErrors.rows[id];
      setValidationErrors(newErrors);
    }
  };

  const validate = (): boolean => {
    const errors: { date?: string; user?: string; rows?: Record<string, Record<string, string>>; general?: string } = {};

    if (!date) {
      errors.date = 'Date is required';
    }

    // Validate user selection for admins creating new logs
    if (isAdmin && !initialData && !selectedUserId) {
      errors.user = 'Please select a user';
    }

    const rowErrors: Record<string, Record<string, string>> = {};
    let hasValidRow = false;

    rows.forEach((row) => {
      const rowError: Record<string, string> = {};

      if (!row.projectId) {
        rowError.projectId = 'Project is required';
      }

      if (!row.taskDescription.trim()) {
        rowError.taskDescription = 'Task description is required';
      }

      // Validate time formats
      const actualTimeError = validateTimeFormat(row.actualTimeSpent);
      if (actualTimeError) {
        rowError.actualTimeSpent = actualTimeError;
      }

      const trackedTimeError = validateTimeFormat(row.trackedTime);
      if (trackedTimeError) {
        rowError.trackedTime = trackedTimeError;
      }

      if (Object.keys(rowError).length === 0) {
        hasValidRow = true;
      } else {
        rowErrors[row.id] = rowError;
      }
    });

    if (!hasValidRow) {
      if (Object.keys(rowErrors).length === 0) {
        errors.general = 'At least one valid log entry is required';
      } else {
        errors.rows = rowErrors;
      }
    } else if (Object.keys(rowErrors).length > 0) {
      errors.rows = rowErrors;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const logEntries: CreateLogDto[] = rows
      .filter(
        (row) =>
          row.projectId &&
          row.taskDescription.trim()
      )
      .map((row) => ({
        project_id: Number(row.projectId),
        date: istToIso(date), // Convert IST input to ISO for API
        task_description: row.taskDescription.trim(),
        actual_time_spent: normalizeTimeInput(row.actualTimeSpent),
        tracked_time: normalizeTimeInput(row.trackedTime),
        // Include user_id if admin is creating log for another user
        ...(isAdmin && selectedUserId ? { user_id: selectedUserId } : {}),
      }));

    try {
      await onSubmit(logEntries);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  // Get user name if admin is editing another user's log
  const logOwnerId = initialData?.[0]?.user_id;
  const logOwner = logOwnerId ? users.find((u) => u.id === logOwnerId) : null;
  const userName = logOwner?.name;

  // Determine title based on role and context
  const getTitle = () => {
    if (!initialData) {
      return 'Create Log Entry';
    }
    if (isAdmin && userName) {
      return `Edit Log Entry for ${userName}`;
    }
    return 'Edit Log Entry';
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorDisplay error={error} />}

          {/* User selector - only for admins creating new logs */}
          {isAdmin && !initialData && (
            <div className="space-y-2">
              <label htmlFor="user-select" className="text-sm font-medium">
                Select User
              </label>
              <Select
                value={selectedUserId?.toString() || ''}
                onValueChange={(value) => {
                  const userId = parseInt(value, 10);
                  setSelectedUserId(userId);
                  // Clear user validation error
                  if (validationErrors.user) {
                    setValidationErrors({ ...validationErrors, user: undefined });
                  }
                  // Reset project selections when user changes
                  setRows(rows.map((row) => ({ ...row, projectId: '' })));
                }}
              >
                <SelectTrigger id="user-select" className={cn(validationErrors.user ? 'aria-invalid' : '')}>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((userWithProjects) => (
                    <SelectItem key={userWithProjects.id} value={userWithProjects.id.toString()}>
                      {userWithProjects.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.user && (
                <p className="text-sm text-destructive">{validationErrors.user}</p>
              )}
            </div>
          )}

          <DatePicker
            label="Date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (validationErrors.date) {
                setValidationErrors({ ...validationErrors, date: undefined });
              }
            }}
            error={validationErrors.date}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Project</TableHead>
                <TableHead className="w-[50%]">Task Description</TableHead>
                <TableHead className="w-[10%]">Actual Time</TableHead>
                <TableHead className="w-[10%]">Tracked Time</TableHead>
                <TableHead className="w-[5%] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const rowErrors = validationErrors.rows?.[row.id] || {};
                return (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      <TableCell>
                        <div className="space-y-1">
                          <Select
                            value={row.projectId.toString()}
                            onValueChange={(value) => updateRow(row.id, { projectId: parseInt(value, 10) })}
                          >
                            <SelectTrigger className={cn(rowErrors.projectId ? 'aria-invalid' : '', 'w-full')}>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {rowErrors.projectId && (
                            <p className="text-xs text-destructive">{rowErrors.projectId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Textarea
                            placeholder="Enter task description"
                            value={row.taskDescription}
                            onChange={(e) => updateRow(row.id, { taskDescription: e.target.value })}
                            className={cn(
                              rowErrors.taskDescription ? 'aria-invalid' : '',
                              'min-h-10'
                            )}
                            rows={3}
                          />
                          {rowErrors.taskDescription && (
                            <p className="text-xs text-destructive">{rowErrors.taskDescription}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="relative">
                            <Input
                              type="text"
                              value={row.actualTimeSpent}
                              onChange={(e) =>
                                updateRow(row.id, { actualTimeSpent: e.target.value })
                              }
                              onBlur={(e) => {
                                const normalized = normalizeTimeInput(e.target.value);
                                updateRow(row.id, { actualTimeSpent: normalized });
                              }}
                              placeholder="0:00"
                              className={rowErrors.actualTimeSpent ? 'aria-invalid pr-6' : 'pr-6'}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              h
                            </span>
                          </div>
                          {rowErrors.actualTimeSpent && (
                            <p className="text-xs text-destructive">{rowErrors.actualTimeSpent}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="relative">
                            <Input
                              type="text"
                              value={row.trackedTime}
                              onChange={(e) =>
                                updateRow(row.id, { trackedTime: e.target.value })
                              }
                              onBlur={(e) => {
                                const normalized = normalizeTimeInput(e.target.value);
                                updateRow(row.id, { trackedTime: normalized });
                              }}
                              placeholder="0:00"
                              className={rowErrors.trackedTime ? 'aria-invalid pr-6' : 'pr-6'}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              h
                            </span>
                          </div>
                          {rowErrors.trackedTime && (
                            <p className="text-xs text-destructive">{rowErrors.trackedTime}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleAddRow}
                            title="Add row"
                          >
                            <IconPlus className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={rows.length === 1}
                            title="Remove row"
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          {validationErrors.general && (
            <p className="text-sm text-destructive">{validationErrors.general}</p>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
