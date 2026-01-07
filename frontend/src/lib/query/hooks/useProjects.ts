import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { Project, CreateProjectDto, ApiResponse } from '../../api/types';
import { useDispatch } from 'react-redux';
import { setProjects, addProject, updateProject, removeProject } from '../../../store/slices/projectsSlice';

export const useProjects = (teamId: number | null, isAdmin?: boolean) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['projects', teamId],
    queryFn: async () => {
      if (isAdmin) {
        const response = await client.get<ApiResponse<Project[]>>(endpoints.projects.list);
        dispatch(setProjects(response.data.data));
        return response.data.data;
      }
      if (teamId !== null && !isAdmin) {
        const response = await client.get<ApiResponse<Project[]>>(endpoints.projects.getMy);
        dispatch(setProjects(response.data.data));
        return response.data.data;
      }
    },
    enabled: !!(isAdmin || teamId),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: CreateProjectDto) => {
      const response = await client.post<ApiResponse<Project>>(endpoints.projects.create, data);
      return response.data.data;
    },
    onSuccess: (project) => {
      dispatch(addProject(project));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateProjectDto> }) => {
      const response = await client.put<ApiResponse<Project>>(endpoints.projects.update(id), data);
      return response.data.data;
    },
    onSuccess: (project) => {
      dispatch(updateProject(project));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (id: number) => {
      await client.delete(endpoints.projects.delete(id));
      return id;
    },
    onSuccess: (id) => {
      dispatch(removeProject(id));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useMyProjects = () => {
  return useQuery({
    queryKey: ['projects', 'my'],
    queryFn: async () => {
      const response = await client.get<ApiResponse<Project[]>>(endpoints.projects.getMy);
      return response.data.data;
    },
  });
};

