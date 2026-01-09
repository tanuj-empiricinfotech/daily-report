import { MultiRowLogForm } from '@/components/logs/MultiRowLogForm';
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
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import type { CreateLogDto, UpdateLogDto } from '@/lib/api/types';
import { useCreateLogsBulk, useDeleteLog, useLog, useUpdateLog } from '@/lib/query/hooks/useLogs';
import { useProjects, useMyProjects } from '@/lib/query/hooks/useProjects';
import { isDateInPast } from '@/utils/date';
import { IconTrash } from '@tabler/icons-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsersWithProjectsByTeam } from '@/lib/query/hooks/useUsers';

export function EditLogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const logId = id ? parseInt(id, 10) : null;

  const { user, isAdmin } = useAuth();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateLogMutation = useUpdateLog();
  const deleteLogMutation = useDeleteLog();
  const createLogsBulkMutation = useCreateLogsBulk();

  const { data: log, isLoading: logLoading, error: logError } = useLog(logId);

  // Fetch users with projects to get the log owner's assigned projects
  const teamId = user?.team_id ?? null;
  const { data: usersWithProjects = [] } = useUsersWithProjectsByTeam(teamId);

  // Fetch all projects (for admin's own logs or fallback)
  const { data: allProjects = [], isLoading: allProjectsLoading } = useProjects(teamId, isAdmin);
  const { data: myProjects = [], isLoading: myProjectsLoading } = useMyProjects();

  // Determine which projects to show based on who owns the log
  const projects = useMemo(() => {
    if (!log) return [];

    // If user is editing their own log, use their projects
    if (log.user_id === user?.id) {
      return isAdmin ? allProjects : myProjects;
    }

    // If admin is editing another user's log, show that user's assigned projects
    if (isAdmin && log.user_id !== user?.id) {
      const logOwner = usersWithProjects.find((u) => u.id === log.user_id);
      if (logOwner) {
        return logOwner.projects;
      }
      // Fallback to all projects if we can't find the user's projects
      return allProjects;
    }

    return [];
  }, [log, user?.id, isAdmin, usersWithProjects, allProjects, myProjects]);

  const projectsLoading = allProjectsLoading || myProjectsLoading;

  const handleSubmit = async (data: CreateLogDto[]): Promise<void> => {
    if (!logId || !log) return;
    if (data.length === 0) {
      throw new Error('At least one log entry is required');
    }

    // First entry is always the existing log being edited
    const existingEntry = data[0];

    // Update the existing log entry
    const updateData: UpdateLogDto = {
      project_id: existingEntry.project_id,
      date: existingEntry.date,
      task_description: existingEntry.task_description,
      actual_time_spent: existingEntry.actual_time_spent,
      tracked_time: existingEntry.tracked_time,
    };
    await updateLogMutation.mutateAsync({ id: logId, data: updateData });

    // Create any additional entries (if user added more rows)
    // When admin is editing another user's log, new entries should be created for that user
    const newEntries = data.slice(1);
    if (newEntries.length > 0) {
      // If admin is editing another user's log, include user_id in new entries
      const entriesWithUser = isAdmin && log.user_id !== user?.id
        ? newEntries.map(entry => ({ ...entry, user_id: log.user_id }))
        : newEntries;

      await createLogsBulkMutation.mutateAsync(entriesWithUser);
    }

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

  // Redirect members if they try to edit a past log
  useEffect(() => {
    if (log && !isAdmin && isDateInPast(log.date)) {
      navigate('/logs');
    }
  }, [log, isAdmin, navigate]);

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

      <MultiRowLogForm
        initialData={[log]}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateLogMutation.isPending || createLogsBulkMutation.isPending}
        projects={projects}
        error={(updateLogMutation.error || createLogsBulkMutation.error) as Error | null}
      />
    </div>
  );
}
