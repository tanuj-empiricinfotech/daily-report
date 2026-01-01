import { useNavigate } from 'react-router-dom';
import { MultiRowLogForm } from '@/components/logs/MultiRowLogForm';
import { useMyProjects } from '@/lib/query/hooks/useProjects';
import { useCreateLogsBulk } from '@/lib/query/hooks/useLogs';
import type { CreateLogDto } from '@/lib/api/types';

export function CreateLogPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();
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
