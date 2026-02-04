/**
 * AssignUsersModal Component
 * Modal for assigning users to a project
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/MultiSelect';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useProjectAssignments, useCreateAssignment, useDeleteAssignment } from '@/lib/query/hooks/useAssignments';
import { useQueryClient } from '@tanstack/react-query';

interface AssignUsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number | null;
  projectName: string | null;
  teamId: number | null;
}

export function AssignUsersModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  teamId,
}: AssignUsersModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);

  // Fetch available users (filtered by team)
  const { data: users = [], isLoading: usersLoading } = useUsersByTeam(teamId, true);

  // Fetch project's current assignments
  const { data: currentAssignments = [], isLoading: assignmentsLoading } = useProjectAssignments(projectId);

  // Mutations
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();

  // Initialize selected users from current assignments
  useEffect(() => {
    if (open && currentAssignments.length > 0) {
      const assignedUserIds = currentAssignments.map((assignment) => assignment.user_id);
      setSelectedUserIds(assignedUserIds);
    } else if (open && currentAssignments.length === 0 && !assignmentsLoading) {
      setSelectedUserIds([]);
    }
  }, [open, currentAssignments, assignmentsLoading]);

  // Convert users to MultiSelect options
  const userOptions: MultiSelectOption[] = useMemo(() => {
    return users.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.email})`,
    }));
  }, [users]);

  // Handle save
  const handleSave = async () => {
    if (!projectId) return;

    const currentUserIds = new Set(currentAssignments.map((a) => a.user_id));
    const selectedUserIdsSet = new Set(selectedUserIds.map((id) => Number(id)));

    // Find users to add (in selected but not in current)
    const usersToAdd = Array.from(selectedUserIdsSet).filter(
      (id) => !currentUserIds.has(id)
    );

    // Find users to remove (in current but not in selected)
    const usersToRemove = Array.from(currentUserIds).filter(
      (id) => !selectedUserIdsSet.has(id)
    );

    try {
      // Create new assignments
      const createPromises = usersToAdd.map((userId) =>
        createAssignmentMutation.mutateAsync({
          user_id: userId,
          project_id: projectId,
        })
      );

      // Delete removed assignments
      const deletePromises = usersToRemove.map((userId) =>
        deleteAssignmentMutation.mutateAsync({
          user_id: userId,
          project_id: projectId,
        })
      );

      // Execute all operations
      await Promise.all([...createPromises, ...deletePromises]);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'team'] });

      // Close modal
      onOpenChange(false);
    } catch (error) {
      // Error will be shown via mutation error state
      console.error('Failed to update assignments:', error);
    }
  };

  const isLoading = usersLoading || assignmentsLoading;
  const isSaving = createAssignmentMutation.isPending || deleteAssignmentMutation.isPending;
  const error = createAssignmentMutation.error || deleteAssignmentMutation.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Users to {projectName || 'Project'}</DialogTitle>
          <DialogDescription>
            Select the team members you want to assign to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && <ErrorDisplay error={error as Error} />}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <MultiSelect
              label="Team Members"
              placeholder="Select users..."
              options={userOptions}
              value={selectedUserIds}
              onChange={setSelectedUserIds}
              loading={isLoading}
            />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving || !projectId}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Assignments'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
