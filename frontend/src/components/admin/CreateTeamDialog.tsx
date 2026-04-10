import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCreateTeam } from '@/lib/query/hooks/useTeams';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const createMutation = useCreateTeam();

  const resetForm = () => {
    setName('');
    setDescription('');
    setWebhookUrl('');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name,
        description: description || undefined,
        webhook_url: webhookUrl || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Add a new team. You can assign members and projects after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Team Name</label>
            <Input
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="What does this team do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              MS Teams Webhook URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              placeholder="https://..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              type="url"
              disabled={createMutation.isPending}
            />
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">
              Failed to create team. Please try again.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Team'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
