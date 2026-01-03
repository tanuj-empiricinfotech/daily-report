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

interface LogRow {
  id: string;
  projectId: number | '';
  taskDescription: string;
  actualTimeSpent: number;
  trackedTime: number;
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
  const [date, setDate] = React.useState<string>(
    initialData && initialData.length > 0 ? formatDate(initialData[0].date) : formatDate(new Date())
  );
  const [rows, setRows] = React.useState<LogRow[]>(() => {
    if (initialData && initialData.length > 0) {
      return initialData.map((log, index) => ({
        id: `log-${log.id}-${index}`,
        projectId: log.project_id,
        taskDescription: log.task_description,
        actualTimeSpent: log.actual_time_spent,
        trackedTime: log.tracked_time,
        logId: log.id,
      }));
    }
    return [{ id: Date.now().toString(), projectId: '', taskDescription: '', actualTimeSpent: 0, trackedTime: 0 }];
  });

  React.useEffect(() => {
    if (initialData && initialData.length > 0) {
      setDate(formatDate(initialData[0].date));
      setRows(
        initialData.map((log, index) => ({
          id: `log-${log.id}-${index}`,
          projectId: log.project_id,
          taskDescription: log.task_description,
          actualTimeSpent: log.actual_time_spent,
          trackedTime: log.tracked_time,
          logId: log.id,
        }))
      );
    }
  }, [initialData]);
  const [validationErrors, setValidationErrors] = React.useState<{
    date?: string;
    rows?: Record<string, Record<string, string>>;
    general?: string;
  }>({});

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const newRow: LogRow = {
      id: Date.now().toString(),
      projectId: lastRow?.projectId || '',
      taskDescription: '',
      actualTimeSpent: 0,
      trackedTime: 0,
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
    const errors: { date?: string; rows?: Record<string, Record<string, string>>; general?: string } = {};

    if (!date) {
      errors.date = 'Date is required';
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

      if (row.actualTimeSpent <= 0) {
        rowError.actualTimeSpent = 'Actual time spent must be greater than 0';
      }

      if (row.trackedTime <= 0) {
        rowError.trackedTime = 'Tracked time must be greater than 0';
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
          row.taskDescription.trim() &&
          row.actualTimeSpent > 0 &&
          row.trackedTime > 0
      )
      .map((row) => ({
        project_id: Number(row.projectId),
        date: istToIso(date), // Convert IST input to ISO for API
        task_description: row.taskDescription.trim(),
        actual_time_spent: row.actualTimeSpent,
        tracked_time: row.trackedTime,
      }));

    try {
      await onSubmit(logEntries);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Log Entry' : 'Create Log Entry'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorDisplay error={error} />}

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
                              {projects.map((project) => (
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
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.actualTimeSpent || ''}
                              onChange={(e) =>
                                updateRow(row.id, { actualTimeSpent: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="0.00"
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
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.trackedTime || ''}
                              onChange={(e) =>
                                updateRow(row.id, { trackedTime: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="0.00"
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
