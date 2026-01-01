import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogForm } from '@/components/logs/LogForm';
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
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useMyProjects } from '@/lib/query/hooks/useProjects';
import { useUpdateLog, useDeleteLog } from '@/lib/query/hooks/useLogs';
import client, { endpoints } from '@/lib/api/client';
import type { DailyLog, ApiResponse, UpdateLogDto, CreateLogDto } from '@/lib/api/types';
import { IconTrash } from '@tabler/icons-react';

export function EditLogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const logId = id ? parseInt(id, 10) : null;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();
  const updateLogMutation = useUpdateLog();
  const deleteLogMutation = useDeleteLog();

  const {
    data: log,
    isLoading: logLoading,
    error: logError,
  } = useQuery<DailyLog>({
    queryKey: ['log', logId],
    queryFn: async () => {
      if (!logId) throw new Error('Log ID is required');
      const response = await client.get<ApiResponse<DailyLog>>(endpoints.logs.get(logId));
      return response.data.data;
    },
    enabled: !!logId,
  });

  const handleSubmit = async (data: CreateLogDto): Promise<void> => {
    if (!logId) return;
    const updateData: UpdateLogDto = {
      project_id: data.project_id,
      date: data.date,
      task_description: data.task_description,
      actual_time_spent: data.actual_time_spent,
      tracked_time: data.tracked_time,
    };
    await updateLogMutation.mutateAsync({ id: logId, data: updateData });
    navigate('/logs');
  };

  const handleCancel = () => {
    navigate('/logs');
  };

  const handleDelete = async () => {
    if (!logId) return;
    await deleteLogMutation.mutateAsync(logId);
    navigate('/logs');
  };

  if (logLoading || projectsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (logError || !log) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Log Entry</h1>
        </div>
        <ErrorDisplay error={logError as Error || new Error('Log not found')} />
        <Button variant="outline" onClick={handleCancel}>
          Back to Logs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Log Entry</h1>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteLogMutation.isPending}>
              <IconTrash className="size-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this log entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLogMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <LogForm
        initialData={log}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateLogMutation.isPending}
        projects={projects}
        error={updateLogMutation.error as Error | null}
      />
    </div>
  );
}
