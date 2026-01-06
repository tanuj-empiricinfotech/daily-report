import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { User, ApiResponse, CreateUserDto } from '../../api/types';

export const useUsers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await client.get<ApiResponse<User[]>>(endpoints.users.list);
      return response.data.data;
    },
    enabled,
  });
};

export const useUsersByTeam = (teamId: number | null) => {
  return useQuery({
    queryKey: ['users', 'team', teamId],
    queryFn: async () => {
      if (teamId === null) {
        const response = await client.get<ApiResponse<User[]>>(endpoints.users.list);
        return response.data.data;
      }
      const response = await client.get<ApiResponse<User[]>>(endpoints.users.getByTeam(teamId));
      return response.data.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const response = await client.post<ApiResponse<User>>(endpoints.users.create, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateUserDto> }) => {
      const response = await client.put<ApiResponse<User>>(endpoints.users.update(id), data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await client.delete<ApiResponse<void>>(endpoints.users.delete(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

