import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimeInput } from '@/components/ui/TimeInput';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import type { DailyLog, Project, CreateLogDto } from '@/lib/api/types';
import { formatDate } from '@/utils/formatting';

interface LogFormProps {
  initialData?: DailyLog;
  initialDate?: string;
  onSubmit: (data: CreateLogDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  projects: Project[];
  error?: Error | null;
}

export function LogForm({
  initialData,
  initialDate,
  onSubmit,
  onCancel,
  isLoading = false,
  projects,
  error,
}: LogFormProps) {
  const [projectId, setProjectId] = useState<number | ''>(initialData?.project_id || '');
  const [date, setDate] = useState<string>(
    initialData?.date ? formatDate(initialData.date) : initialDate || formatDate(new Date())
  );
  const [taskDescription, setTaskDescription] = useState<string>(initialData?.task_description || '');
  const [actualTimeSpent, setActualTimeSpent] = useState<number>(initialData?.actual_time_spent || 0);
  const [trackedTime, setTrackedTime] = useState<number>(initialData?.tracked_time || 0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setProjectId(initialData.project_id);
      setDate(formatDate(initialData.date));
      setTaskDescription(initialData.task_description);
      setActualTimeSpent(initialData.actual_time_spent);
      setTrackedTime(initialData.tracked_time);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (typeof projectId === 'string') {
      errors.projectId = 'Project is required';
    }

    if (!date) {
      errors.date = 'Date is required';
    }

    if (!taskDescription.trim()) {
      errors.taskDescription = 'Task description is required';
    }

    if (actualTimeSpent <= 0) {
      errors.actualTimeSpent = 'Actual time spent must be greater than 0';
    }

    if (trackedTime <= 0) {
      errors.trackedTime = 'Tracked time must be greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        project_id: Number(projectId),
        date,
        task_description: taskDescription.trim(),
        actual_time_spent: actualTimeSpent,
        tracked_time: trackedTime,
      });
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

          <div className="space-y-2">
            <Select
              value={projectId.toString()}
              onValueChange={(value) => setProjectId(parseInt(value, 10))}
            >
              <SelectTrigger className={validationErrors.projectId ? 'aria-invalid' : ''}>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.projectId && (
              <p className="text-sm text-destructive">{validationErrors.projectId}</p>
            )}
          </div>

          <DatePicker
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={validationErrors.date}
          />

          <div className="space-y-2">
            <Textarea
              placeholder="Enter task description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className={validationErrors.taskDescription ? 'aria-invalid' : ''}
              rows={4}
            />
            {validationErrors.taskDescription && (
              <p className="text-sm text-destructive">{validationErrors.taskDescription}</p>
            )}
          </div>

          <TimeInput
            label="Actual Time Spent"
            value={actualTimeSpent}
            onChange={setActualTimeSpent}
            error={validationErrors.actualTimeSpent}
          />

          <TimeInput
            label="Tracked Time"
            value={trackedTime}
            onChange={setTrackedTime}
            error={validationErrors.trackedTime}
          />

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
