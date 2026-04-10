import { useState, useEffect } from 'react';
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
import { useUpdateTeam } from '@/lib/query/hooks/useTeams';
import type { Team } from '@/lib/api/types';

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function EditTeamDialog({ open, onOpenChange, team }: EditTeamDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const updateMutation = useUpdateTeam();

  useEffect(() => {
    if (open && team) {
      setName(team.name);
      setDescription(team.description || '');
      setWebhookUrl(team.webhook_url || '');
    }
  }, [open, team]);

  const handleUpdate = async () => {
    if (!team || !name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: team.id,
        data: {
          name,
          description: description || undefined,
          webhook_url: webhookUrl || undefined,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update the team details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Team Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
            />
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              Failed to update team. Please try again.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpdate}
            disabled={!name.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
