import { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useUsersByTeam, useCreateUser, useUpdateUser, useDeleteUser } from '@/lib/query/hooks/useUsers';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useCreateAssignment, useDeleteAssignment, useUserAssignments } from '@/lib/query/hooks/useAssignments';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { User, Project, CreateUserDto } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAuth } from '@/hooks/useAuth';

interface UserCardProps {
  user: User;
  projects: Project[];
  onUnassign: (userId: number, projectId: number) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

function UserCard({ user, projects, onUnassign, onEdit, onDelete }: UserCardProps) {
  const { data: assignments = [], isLoading: assignmentsLoading } = useUserAssignments(user.id);

  const assignedProjects = assignments
    .map((assignment) => projects.find((p) => p.id === assignment.project_id))
    .filter((project): project is Project => project !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{user.name}</CardTitle>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {user.name}? This action cannot be undone and will remove all associated assignments and logs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(user.id)}
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
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Assigned Projects:</p>
            <Badge variant="outline">{assignedProjects.length}</Badge>
          </div>
          {assignmentsLoading ? (
            <div className="flex justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : assignedProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No projects assigned</p>
          ) : (
            <div className="space-y-2">
              {assignedProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-sm">{project.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Unassign
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unassign Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to unassign {user.name} from {project.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onUnassign(user.id, project.id)}
                          variant="destructive"
                        >
                          Unassign
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserManager() {
  const { isAdmin } = useAuth();
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const { data: users = [], isLoading: usersLoading } = useUsersByTeam(selectedTeamId, isAdmin);
  const { data: projects = [], isLoading: projectsLoading } = useProjects(selectedTeamId);
  const { data: teams = [] } = useTeams({ isAdmin });
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [teamId, setTeamId] = useState<number | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        name,
        role,
        team_id: teamId,
      });
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setTeamId(user.team_id);
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim() || !email.trim()) return;
    try {
      const updateData: Partial<CreateUserDto> = {
        name,
        email,
        role,
        team_id: teamId,
      };
      if (password.trim()) {
        updateData.password = password;
      }
      await updateUserMutation.mutateAsync({
        id: editingId,
        data: updateData,
      });
      resetForm();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedProjectId) return;
    try {
      await createAssignmentMutation.mutateAsync({
        user_id: selectedUserId,
        project_id: selectedProjectId,
      });
      setSelectedUserId(null);
      setSelectedProjectId(null);
    } catch (error) {
      console.error('Failed to assign user to project:', error);
    }
  };

  const handleUnassign = async (userId: number, projectId: number) => {
    try {
      await deleteAssignmentMutation.mutateAsync({
        user_id: userId,
        project_id: projectId,
      });
    } catch (error) {
      console.error('Failed to unassign user from project:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('member');
    setTeamId(null);
  };

  if (usersLoading || projectsLoading) {
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
          <CardTitle>{editingId ? 'Edit User' : 'Create User'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="User name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createUserMutation.isPending || updateUserMutation.isPending || !!editingId}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Password {editingId && '(leave empty to keep current)'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editingId ? 'Leave empty to keep current' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-5 w-5" />
                  ) : (
                    <IconEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={role}
                onValueChange={(val: 'admin' | 'member') => setRole(val)}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Team (optional)</label>
              <Select
                value={teamId?.toString() || 'all'}
                onValueChange={(val) => setTeamId(val === 'all' ? null : parseInt(val, 10))}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">No Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={
                  !name.trim() ||
                  !email.trim() ||
                  (!password.trim() && !editingId) ||
                  createUserMutation.isPending ||
                  updateUserMutation.isPending
                }
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingId ? (
                  'Update User'
                ) : (
                  'Create User'
                )}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
            {(createUserMutation.isError || updateUserMutation.isError) && (
              <p className="text-sm text-destructive">
                {createUserMutation.isError
                  ? 'Failed to create user. Please try again.'
                  : 'Failed to update user. Please try again.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Users to Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedUserId?.toString() || ''}
              onValueChange={(val) => setSelectedUserId(val ? parseInt(val, 10) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedProjectId?.toString() || ''}
              onValueChange={(val) => setSelectedProjectId(val ? parseInt(val, 10) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || !selectedProjectId || createAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
            {createAssignmentMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to assign user. Please try again.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {selectedTeamId
                ? 'No users found in this team.'
                : 'No users found. Create a user to get started.'}
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              projects={projects}
              onUnassign={handleUnassign}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
