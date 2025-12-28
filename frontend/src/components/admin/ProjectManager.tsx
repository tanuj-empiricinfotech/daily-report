import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/lib/query/hooks/useProjects';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function ProjectManager() {
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const { data: teams = [] } = useTeams();
  const { data: projects = [], isLoading } = useProjects(selectedTeamId);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(selectedTeamId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !teamId) return;
    await createMutation.mutateAsync({ team_id: teamId, name, description });
    setName('');
    setDescription('');
  };

  const handleEdit = (id: number) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setEditingId(id);
      setTeamId(project.team_id);
      setName(project.name);
      setDescription(project.description || '');
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim()) return;
    await updateMutation.mutateAsync({ id: editingId, data: { name, description } });
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
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
          <CardTitle>Create Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={teamId?.toString() || ''}
              onValueChange={(val) => setTeamId(parseInt(val, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button onClick={editingId ? handleUpdate : handleCreate} disabled={!name.trim() || !teamId}>
              {editingId ? 'Update Project' : 'Create Project'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={() => {
                setEditingId(null);
                setName('');
                setDescription('');
              }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{project.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(project.id)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            {project.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

