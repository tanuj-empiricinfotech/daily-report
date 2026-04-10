import { useState } from 'react';
import { useTeams, useUpdateTeam, useDeleteTeam } from '@/lib/query/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
import { useAuth } from '@/hooks/useAuth';

export function TeamManager() {
  const { isAdmin } = useAuth();
  const { data: teams = [], isLoading } = useTeams({ isAdmin });
  const updateMutation = useUpdateTeam();
  const deleteMutation = useDeleteTeam();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleEdit = (id: number) => {
    const team = teams.find((t) => t.id === id);
    if (team) {
      setEditingId(id);
      setName(team.name);
      setDescription(team.description || '');
      setWebhookUrl(team.webhook_url || '');
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: { name, description, webhook_url: webhookUrl || undefined },
      });
      setEditingId(null);
      setName('');
      setDescription('');
      setWebhookUrl('');
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setWebhookUrl('');
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No teams yet. Click &quot;New Team&quot; above to create one.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <Card key={team.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{team.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(team.id)}
                  disabled={deleteMutation.isPending}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={deleteMutation.isPending}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{team.name}&quot;? This will remove
                        all associated projects, members, and logs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(team.id)}
                        variant="destructive"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>

          {editingId === team.id ? (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Team Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">MS Teams Webhook URL</label>
                  <Input
                    placeholder="https://..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    type="url"
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdate}
                    disabled={!name.trim() || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Team'
                    )}
                  </Button>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
                {updateMutation.isError && (
                  <p className="text-sm text-destructive">
                    Failed to update team. Please try again.
                  </p>
                )}
              </div>
            </CardContent>
          ) : (
            (team.description || team.webhook_url) && (
              <CardContent className="space-y-2">
                {team.description && (
                  <p className="text-sm text-muted-foreground">{team.description}</p>
                )}
                {team.webhook_url && (
                  <div className="text-sm">
                    <span className="font-medium">Teams Webhook:</span>{' '}
                    <span className="text-muted-foreground truncate block">{team.webhook_url}</span>
                  </div>
                )}
              </CardContent>
            )
          )}
        </Card>
      ))}
    </div>
  );
}

