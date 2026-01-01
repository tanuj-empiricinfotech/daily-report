import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogForm } from './LogForm';
import type { DailyLog } from '@/lib/api/types';

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
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingLogs && existingLogs.length > 0 ? 'Edit Log Entry' : 'New Log Entry'}
          </DialogTitle>
        </DialogHeader>
        <LogForm
          date={date}
          existingLogs={existingLogs}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
