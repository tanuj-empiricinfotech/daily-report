import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogForm } from './LogForm';
import { useMyProjects } from '@/lib/query/hooks/useProjects';
import { useCreateLog } from '@/lib/query/hooks/useLogs';
import type { DailyLog, CreateLogDto } from '@/lib/api/types';

interface LogFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existingLogs?: DailyLog[];
  onSuccess: () => void;
}

export function LogFormModal({
  open,
  onOpenChange,
  date,
  existingLogs,
  onSuccess,
}: LogFormModalProps) {
  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();
  const createLogMutation = useCreateLog();

  const initialData = existingLogs && existingLogs.length > 0 ? existingLogs[0] : undefined;

  const handleSubmit = async (data: CreateLogDto): Promise<void> => {
    await createLogMutation.mutateAsync(data);
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Log Entry' : 'New Log Entry'}
          </DialogTitle>
        </DialogHeader>
        <LogForm
          initialData={initialData}
          initialDate={date}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createLogMutation.isPending || projectsLoading}
          projects={projects}
          error={createLogMutation.error as Error | null}
        />
      </DialogContent>
    </Dialog>
  );
}
