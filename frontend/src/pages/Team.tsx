/**
 * Team Page
 * Manage team members with CRUD operations
 * Admin-only page
 */

import { useState, useMemo } from 'react';
import { IconPlus, IconEdit, IconTrash, IconMail, IconShield, IconCopy, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/lib/query/hooks/useUsers';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useProjects } from '@/lib/query/hooks/useProjects';
import type { User, CreateUserDto } from '@/lib/api/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

// Constants
const DIALOG_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
  CLOSED: null,
} as const;

type DialogMode = typeof DIALOG_MODE[keyof typeof DIALOG_MODE];

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  team_id: number | null;
}

const INITIAL_FORM_DATA: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'member',
  team_id: null,
};

/**
 * Get user initials for avatar
 */
function getUserInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Team() {
  const { user, isAdmin } = useAuth();
  const [dialogMode, setDialogMode] = useState<DialogMode>(DIALOG_MODE.CLOSED);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Fetch data
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: projects = [], isLoading: projectsLoading } = useProjects(user?.team_id || null);

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Copy email to clipboard
  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      console.error('Failed to copy email:', error);
    }
  };

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
    setSelectedUser(null);
    setDialogMode(DIALOG_MODE.CREATE);
  };

  const handleEdit = (editUser: User) => {
    setFormData({
      name: editUser.name,
      email: editUser.email,
      password: '', // Don't populate password for edit
      role: editUser.role,
      team_id: editUser.team_id,
    });
    setSelectedUser(editUser);
    setDialogMode(DIALOG_MODE.EDIT);
  };

  const handleCloseDialog = () => {
    setDialogMode(DIALOG_MODE.CLOSED);
    setSelectedUser(null);
    setFormData(INITIAL_FORM_DATA);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (dialogMode === DIALOG_MODE.CREATE) {
        const userData: CreateUserDto = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          team_id: formData.team_id,
        };
        await createUserMutation.mutateAsync(userData);
      } else if (dialogMode === DIALOG_MODE.EDIT && selectedUser) {
        const updateData: Partial<CreateUserDto> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          team_id: formData.team_id,
        };

        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: updateData,
        });
      }
      handleCloseDialog();
    } catch (error) {
      // Error will be shown via mutation error state
    }
  };

  // Handle delete
  const handleDeleteClick = (userId: number) => {
    // Prevent deleting self
    if (userId === user?.id) {
      return;
    }
    setDeleteUserId(userId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;

    try {
      await deleteUserMutation.mutateAsync(deleteUserId);
      setDeleteUserId(null);
    } catch (error) {
      // Error will be shown via mutation error state
    }
  };

  // Table columns
  const columns = useMemo<Column<User>[]>(
    () => [
      {
        id: 'user',
        header: 'User',
        accessorFn: (row) => row.name,
        enableSorting: true,
        cell: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getUserInitials(row.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <IconMail className="h-3 w-3" />
                <span>{row.email}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyEmail(row.email);
                  }}
                  className="ml-1 hover:text-foreground transition-colors p-0.5"
                  title="Copy email"
                >
                  {copiedEmail === row.email ? (
                    <IconCheck className="h-3 w-3 text-green-500" />
                  ) : (
                    <IconCopy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ),
        width: '300px',
      },
      {
        id: 'role',
        header: 'Role',
        accessorFn: (row) => row.role,
        enableSorting: true,
        cell: (row) => (
          <Badge variant={row.role === 'admin' ? 'default' : 'secondary'}>
            <IconShield className="mr-1 h-3 w-3" />
            {row.role === 'admin' ? 'Admin' : 'Member'}
          </Badge>
        ),
        width: '120px',
      },
      {
        id: 'team',
        header: 'Team',
        accessorFn: (row) => {
          const team = teams.find((t) => t.id === row.team_id);
          return team?.name || 'No Team';
        },
        cell: (row) => {
          const team = teams.find((t) => t.id === row.team_id);
          return team ? (
            <Badge variant="outline">{team.name}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">No Team</span>
          );
        },
      },
      {
        id: 'projects',
        header: 'Assigned Projects',
        enableSorting: false,
        cell: (row) => {
          // Filter projects by team_id to show only assigned projects
          const userProjects = projects.filter((p) => p.team_id === row.team_id);

          if (userProjects.length === 0) {
            return <span className="text-muted-foreground text-sm">No projects</span>;
          }

          // Show max 3 project badges
          const displayProjects = userProjects.slice(0, 3);
          const remainingCount = userProjects.length - displayProjects.length;

          return (
            <div className="flex flex-wrap gap-1">
              {displayProjects.map((project) => (
                <Badge key={project.id} variant="secondary" className="text-xs">
                  {project.name}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{remainingCount}
                </Badge>
              )}
            </div>
          );
        },
        width: '250px',
      },
      {
        id: 'created_at',
        header: 'Joined',
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
              disabled={row.id === user?.id}
            >
              <IconTrash
                className={`h-4 w-4 ${
                  row.id === user?.id ? 'text-muted-foreground' : 'text-destructive'
                }`}
              />
            </Button>
          </div>
        ),
        width: '120px',
      },
    ],
    [teams, projects, user?.id, copiedEmail]
  );

  const isLoading = usersLoading || teamsLoading || projectsLoading;
  const mutationError =
    createUserMutation.error ||
    updateUserMutation.error ||
    deleteUserMutation.error;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        <Button onClick={handleCreate}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Error Display */}
      {mutationError && (
        <ErrorDisplay error={(mutationError as Error).message} />
      )}

      {/* Team Members Table */}
      <DataTable
        data={users}
        columns={columns}
        loading={isLoading}
        emptyMessage="No team members found. Add your first member to get started."
        getRowId={(row) => row.id.toString()}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogMode !== DIALOG_MODE.CLOSED} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === DIALOG_MODE.CREATE ? 'Add Team Member' : 'Edit Team Member'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === DIALOG_MODE.CREATE
                ? 'Add a new member to your team.'
                : 'Update team member details.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {dialogMode === DIALOG_MODE.EDIT && '(leave empty to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required={dialogMode === DIALOG_MODE.CREATE}
                minLength={6}
              />
              {dialogMode === DIALOG_MODE.CREATE && (
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'admin' | 'member' })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <select
                id="team"
                value={formData.team_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    team_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No Team</option>
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
                  createUserMutation.isPending || updateUserMutation.isPending
                }
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : dialogMode === DIALOG_MODE.CREATE ? (
                  'Add Member'
                ) : (
                  'Update'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? This action cannot be undone.
              All their data and logs will remain but they will no longer have access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? <LoadingSpinner size="sm" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
