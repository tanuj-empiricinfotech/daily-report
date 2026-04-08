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
import { Badge } from '@/components/ui/badge';
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
import type { Project } from '@/lib/api/types';
import { ProjectProgressBar } from '@/components/projects/ProjectProgressBar';

interface DeleteProjectDialogProps {
  project: Project;
  onConfirm: () => void;
}

function DeleteProjectDialog({ project, onConfirm }: DeleteProjectDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone and will remove all associated assignments and logs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ProjectManager() {
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const { data: teams = [] } = useTeams({ isAdmin: true });
  const { data: projects = [], isLoading } = useProjects(selectedTeamId);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(selectedTeamId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [progressTrackingEnabled, setProgressTrackingEnabled] = useState(false);
  const [estimatedHoursInput, setEstimatedHoursInput] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setProgressTrackingEnabled(false);
    setEstimatedHoursInput('');
  };

  const parseEstimatedHours = (): number | null => {
    if (!progressTrackingEnabled) return null;
    const trimmed = estimatedHoursInput.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const handleCreate = async () => {
    if (!name.trim() || !teamId) return;
    try {
      await createMutation.mutateAsync({
        team_id: teamId,
        name,
        description,
        estimated_hours: parseEstimatedHours(),
        progress_tracking_enabled: progressTrackingEnabled,
      });
      resetForm();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleEdit = (id: number) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setEditingId(id);
      setTeamId(project.team_id);
      setName(project.name);
      setDescription(project.description || '');
      setProgressTrackingEnabled(project.progress_tracking_enabled);
      setEstimatedHoursInput(
        project.estimated_hours !== null ? String(project.estimated_hours) : ''
      );
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          name,
          description,
          estimated_hours: parseEstimatedHours(),
          progress_tracking_enabled: progressTrackingEnabled,
        },
      });
      resetForm();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
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
          <CardTitle>{editingId ? 'Edit Project' : 'Create Project'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Team</label>
              <Select
                value={teamId?.toString() || ''}
                onValueChange={(val) => setTeamId(parseInt(val, 10))}
                disabled={!!editingId}
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
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Project Name</label>
              <Input
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>
            <div className="rounded-md border p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={progressTrackingEnabled}
                  onChange={(e) => setProgressTrackingEnabled(e.target.checked)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                <span className="text-sm font-medium">
                  Track progress against estimated hours
                </span>
              </label>
              {progressTrackingEnabled && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Estimated hours
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 40"
                    value={estimatedHoursInput}
                    onChange={(e) => setEstimatedHoursInput(e.target.value)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={!name.trim() || !teamId || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingId ? (
                  'Update Project'
                ) : (
                  'Create Project'
                )}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-sm text-destructive">
                {createMutation.isError
                  ? 'Failed to create project. Please try again.'
                  : 'Failed to update project. Please try again.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {selectedTeamId
                ? 'No projects found for the selected team.'
                : 'Select a team to view projects.'}
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const projectTeam = teams.find((t) => t.id === project.team_id);
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle>{project.name}</CardTitle>
                      {projectTeam && (
                        <Badge variant="outline">{projectTeam.name}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(project.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Edit
                      </Button>
                      <DeleteProjectDialog
                        project={project}
                        onConfirm={() => handleDelete(project.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                {(project.description || project.progress_tracking_enabled) && (
                  <CardContent className="space-y-3">
                    {project.description && (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    )}
                    {project.progress_tracking_enabled && (
                      project.estimated_hours !== null && project.estimated_hours > 0 ? (
                        <ProjectProgressBar
                          trackedHours={project.tracked_hours_total}
                          estimatedHours={project.estimated_hours}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Progress tracking enabled, but no estimated hours set.
                        </p>
                      )
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

