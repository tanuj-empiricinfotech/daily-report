import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { ProjectAssignment, ApiResponse } from '../../api/types';

export const useUserAssignments = (userId: number | null) => {
  return useQuery({
    queryKey: ['assignments', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await client.get<ApiResponse<ProjectAssignment[]>>(endpoints.assignments.getUserAssignments(userId));
      return response.data.data;
    },
    enabled: !!userId,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { project_id: number; user_id: number }) => {
      const response = await client.post<ApiResponse<ProjectAssignment>>(endpoints.assignments.create, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { project_id: number; user_id: number }) => {
      await client.delete(endpoints.assignments.delete, { data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useProjectAssignments = (projectId: number | null) => {
  return useQuery({
    queryKey: ['assignments', 'project', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await client.get<ApiResponse<ProjectAssignment[]>>(endpoints.assignments.getProjectAssignments(projectId));
      return response.data.data;
    },
    enabled: !!projectId,
  });
};
