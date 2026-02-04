/**
 * AssignProjectsModal Component
 * Modal for assigning projects to a user
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
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useUserAssignments, useCreateAssignment, useDeleteAssignment } from '@/lib/query/hooks/useAssignments';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface AssignProjectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
  userName: string | null;
}

export function AssignProjectsModal({
  open,
  onOpenChange,
  userId,
  userName,
}: AssignProjectsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProjectIds, setSelectedProjectIds] = useState<(string | number)[]>([]);

  // Fetch available projects (filtered by user's team if not admin)
  const { data: projects = [], isLoading: projectsLoading } = useProjects(user?.team_id || null);

  // Fetch user's current assignments
  const { data: currentAssignments = [], isLoading: assignmentsLoading } = useUserAssignments(userId);

  // Mutations
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();

  // Initialize selected projects from current assignments
  useEffect(() => {
    if (open && currentAssignments.length > 0) {
      const assignedProjectIds = currentAssignments.map((assignment) => assignment.project_id);
      setSelectedProjectIds(assignedProjectIds);
    } else if (open && currentAssignments.length === 0 && !assignmentsLoading) {
      setSelectedProjectIds([]);
    }
  }, [open, currentAssignments, assignmentsLoading]);

  // Convert projects to MultiSelect options
  const projectOptions: MultiSelectOption[] = useMemo(() => {
    return projects.map((project) => ({
      value: project.id,
      label: project.name,
    }));
  }, [projects]);

  // Handle save
  const handleSave = async () => {
    if (!userId) return;

    const currentProjectIds = new Set(currentAssignments.map((a) => a.project_id));
    const selectedProjectIdsSet = new Set(selectedProjectIds.map((id) => Number(id)));

    // Find projects to add (in selected but not in current)
    const projectsToAdd = Array.from(selectedProjectIdsSet).filter(
      (id) => !currentProjectIds.has(id)
    );

    // Find projects to remove (in current but not in selected)
    const projectsToRemove = Array.from(currentProjectIds).filter(
      (id) => !selectedProjectIdsSet.has(id)
    );

    try {
      // Create new assignments
      const createPromises = projectsToAdd.map((projectId) =>
        createAssignmentMutation.mutateAsync({
          user_id: userId,
          project_id: projectId,
        })
      );

      // Delete removed assignments
      const deletePromises = projectsToRemove.map((projectId) =>
        deleteAssignmentMutation.mutateAsync({
          user_id: userId,
          project_id: projectId,
        })
      );

      // Execute all operations
      await Promise.all([...createPromises, ...deletePromises]);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'team'] });

      // Close modal
      onOpenChange(false);
    } catch (error) {
      // Error will be shown via mutation error state
      console.error('Failed to update assignments:', error);
    }
  };

  const isLoading = projectsLoading || assignmentsLoading;
  const isSaving = createAssignmentMutation.isPending || deleteAssignmentMutation.isPending;
  const error = createAssignmentMutation.error || deleteAssignmentMutation.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Projects to {userName || 'User'}</DialogTitle>
          <DialogDescription>
            Select the projects you want to assign to this team member.
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
              label="Projects"
              placeholder="Select projects..."
              options={projectOptions}
              value={selectedProjectIds}
              onChange={setSelectedProjectIds}
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
            disabled={isLoading || isSaving || !userId}
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
