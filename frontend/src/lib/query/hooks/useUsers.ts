import { useQuery } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { User, ApiResponse } from '../../api/types';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await client.get<ApiResponse<User[]>>(endpoints.users.list);
      return response.data.data;
    },
  });
};

export const useUsersByTeam = (teamId: number | null) => {
  return useQuery({
    queryKey: ['users', 'team', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const response = await client.get<ApiResponse<User[]>>(endpoints.users.getByTeam(teamId));
      return response.data.data;
    },
    enabled: !!teamId,
  });
};

