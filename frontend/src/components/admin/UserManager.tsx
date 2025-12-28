import { useState } from 'react';
import { useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useCreateAssignment, useDeleteAssignment } from '@/lib/query/hooks/useAssignments';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
    await createAssignmentMutation.mutateAsync({
      user_id: selectedUserId,
      project_id: selectedProjectId,
    });
    setSelectedUserId(null);
    setSelectedProjectId(null);
  };

  const handleUnassign = async (userId: number, projectId: number) => {
    await deleteAssignmentMutation.mutateAsync({
      user_id: userId,
      project_id: projectId,
    });
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
            <Button onClick={handleAssign} disabled={!selectedUserId || !selectedProjectId}>
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Assigned Projects:</p>
                {projects
                  .filter((p) => {
                    // This is simplified - in a real app, you'd fetch actual assignments
                    return true;
                  })
                  .map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <span>{project.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassign(user.id, project.id)}
                      >
                        Unassign
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

