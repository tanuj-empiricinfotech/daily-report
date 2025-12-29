import { useState } from 'react';
import { useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useCreateAssignment, useDeleteAssignment, useUserAssignments } from '@/lib/query/hooks/useAssignments';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { User, Project } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface UserCardProps {
  user: User;
  projects: Project[];
  onUnassign: (userId: number, projectId: number) => void;
}

function UserCard({ user, projects, onUnassign }: UserCardProps) {
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
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const { data: users = [], isLoading: usersLoading } = useUsersByTeam(selectedTeamId);
  const { data: projects = [], isLoading: projectsLoading } = useProjects(selectedTeamId);
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

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
          <CardTitle>Assign Users to Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedUserId?.toString() || ''}
              onValueChange={(val) => setSelectedUserId(parseInt(val, 10))}
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
              onValueChange={(val) => setSelectedProjectId(parseInt(val, 10))}
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
              No users found in this team.
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              projects={projects}
              onUnassign={handleUnassign}
            />
          ))
        )}
      </div>
    </div>
  );
}

