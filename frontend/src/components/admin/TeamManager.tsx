import { useState } from 'react';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/lib/query/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

export function TeamManager() {
  const { isAdmin } = useAuth();
  const { data: teams = [], isLoading } = useTeams({ isAdmin });
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const deleteMutation = useDeleteTeam();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name, description, webhook_url: webhookUrl || undefined });
    setName('');
    setDescription('');
    setWebhookUrl('');
  };

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
    await updateMutation.mutateAsync({ id: editingId, data: { name, description, webhook_url: webhookUrl || undefined } });
    setEditingId(null);
    setName('');
    setDescription('');
    setWebhookUrl('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this team?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Microsoft Teams Webhook URL (optional)"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              type="url"
            />
            <Button onClick={editingId ? handleUpdate : handleCreate} disabled={!name.trim()}>
              {editingId ? 'Update Team' : 'Create Team'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={() => {
                setEditingId(null);
                setName('');
                setDescription('');
                setWebhookUrl('');
              }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{team.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(team.id)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            {(team.description || team.webhook_url) && (
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
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

