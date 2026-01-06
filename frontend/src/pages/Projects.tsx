/**
 * Projects Page
 * Manage all projects with CRUD operations
 * Admin-only page
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconEdit, IconTrash, IconFolder } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/lib/query/hooks/useProjects';
import { useTeams } from '@/lib/query/hooks/useTeams';
import type { Project, CreateProjectDto } from '@/lib/api/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

// Constants
const DIALOG_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
  CLOSED: null,
} as const;

type DialogMode = typeof DIALOG_MODE[keyof typeof DIALOG_MODE];

interface ProjectFormData {
  name: string;
  description: string;
  team_id: number | null;
}

const INITIAL_FORM_DATA: ProjectFormData = {
  name: '',
  description: '',
  team_id: null,
};

export function Projects() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [dialogMode, setDialogMode] = useState<DialogMode>(DIALOG_MODE.CLOSED);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(INITIAL_FORM_DATA);

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = useProjects(user?.team_id || null);
  const { data: teams = [], isLoading: teamsLoading } = useTeams();

  // Mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Handle dialog open
  const handleCreate = () => {
    setFormData({
      ...INITIAL_FORM_DATA,
      team_id: user?.team_id || null,
    });
    setSelectedProject(null);
    setDialogMode(DIALOG_MODE.CREATE);
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      team_id: project.team_id,
    });
    setSelectedProject(project);
    setDialogMode(DIALOG_MODE.EDIT);
  };

  const handleCloseDialog = () => {
    setDialogMode(DIALOG_MODE.CLOSED);
    setSelectedProject(null);
    setFormData(INITIAL_FORM_DATA);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.team_id) {
      return;
    }

    const projectData: CreateProjectDto = {
      name: formData.name,
      description: formData.description || undefined,
      team_id: formData.team_id,
    };

    try {
      if (dialogMode === DIALOG_MODE.CREATE) {
        await createProjectMutation.mutateAsync(projectData);
      } else if (dialogMode === DIALOG_MODE.EDIT && selectedProject) {
        await updateProjectMutation.mutateAsync({
          id: selectedProject.id,
          data: projectData,
        });
      }
      handleCloseDialog();
    } catch (error) {
      // Error will be shown via mutation error state
    }
  };

  // Handle delete
  const handleDeleteClick = (projectId: number) => {
    setDeleteProjectId(projectId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProjectId) return;

    try {
      await deleteProjectMutation.mutateAsync(deleteProjectId);
      setDeleteProjectId(null);
    } catch (error) {
      // Error will be shown via mutation error state
    }
  };

  // Table columns
  const columns = useMemo<Column<Project>[]>(
    () => [
      {
        id: 'name',
        header: 'Project Name',
        accessorFn: (row) => row.name,
        enableSorting: true,
        cell: (row) => (
          <button
            onClick={() => navigate(`/projects/${row.id}`)}
            className="flex items-center gap-2 hover:text-primary transition-colors text-left w-full"
          >
            <IconFolder className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium hover:underline">{row.name}</span>
          </button>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        accessorFn: (row) => row.description,
        cell: (row) => (
          <span className="text-muted-foreground">
            {row.description || 'No description'}
          </span>
        ),
      },
      {
        id: 'team',
        header: 'Team',
        accessorFn: (row) => {
          const team = teams.find((t) => t.id === row.team_id);
          return team?.name || 'Unknown';
        },
        cell: (row) => {
          const team = teams.find((t) => t.id === row.team_id);
          return team ? (
            <Badge variant="secondary">{team.name}</Badge>
          ) : (
            <span className="text-muted-foreground">Unknown</span>
          );
        },
      },
      {
        id: 'created_at',
        header: 'Created',
        accessorFn: (row) => row.created_at,
        enableSorting: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        ),
        width: '150px',
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        align: 'right',
        cell: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(row.id)}
            >
              <IconTrash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
        width: '120px',
      },
    ],
    [teams, navigate]
  );

  const isLoading = projectsLoading || teamsLoading;
  const mutationError =
    createProjectMutation.error ||
    updateProjectMutation.error ||
    deleteProjectMutation.error;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage all projects and their team assignments
          </p>
        </div>
        <Button onClick={handleCreate}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Error Display */}
      {mutationError && (
        <ErrorDisplay error={(mutationError as Error).message} />
      )}

      {/* Projects Table */}
      <DataTable
        data={projects}
        columns={columns}
        loading={isLoading}
        emptyMessage="No projects found. Create your first project to get started."
        getRowId={(row) => row.id.toString()}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogMode !== DIALOG_MODE.CLOSED} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === DIALOG_MODE.CREATE ? 'Create Project' : 'Edit Project'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === DIALOG_MODE.CREATE
                ? 'Add a new project to your team.'
                : 'Update project details.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <select
                id="team"
                value={formData.team_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, team_id: parseInt(e.target.value) })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createProjectMutation.isPending || updateProjectMutation.isPending
                }
              >
                {createProjectMutation.isPending || updateProjectMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : dialogMode === DIALOG_MODE.CREATE ? (
                  'Create'
                ) : (
                  'Update'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteProjectId !== null} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjectMutation.isPending ? <LoadingSpinner size="sm" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
