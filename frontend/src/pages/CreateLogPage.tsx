import { useNavigate } from 'react-router-dom';
import { MultiRowLogForm } from '@/components/logs/MultiRowLogForm';
import { useMyProjects, useProjects } from '@/lib/query/hooks/useProjects';
import { useCreateLogsBulk } from '@/lib/query/hooks/useLogs';
import type { CreateLogDto } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';

export function CreateLogPage() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  // Admins should see all projects, members see only their assigned projects
  const { data: myProjects = [], isLoading: myProjectsLoading } = useMyProjects();
  const { data: allProjects = [], isLoading: allProjectsLoading } = useProjects(
    user?.team_id ?? null,
    isAdmin
  );

  // Use all projects for admins, user's projects for members
  const projects = isAdmin ? allProjects : myProjects;
  const projectsLoading = isAdmin ? allProjectsLoading : myProjectsLoading;

  const createLogsBulkMutation = useCreateLogsBulk();

  const handleSubmit = async (data: CreateLogDto[]): Promise<void> => {
    if (data.length === 0) {
      throw new Error('At least one log entry is required');
    }
    await createLogsBulkMutation.mutateAsync(data);
    navigate('/logs');
  };

  const handleCancel = () => {
    navigate('/logs');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Log Entry</h1>
      </div>

      <MultiRowLogForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createLogsBulkMutation.isPending || projectsLoading}
        projects={projects}
        error={createLogsBulkMutation.error as Error | null}
      />
    </div>
  );
}
