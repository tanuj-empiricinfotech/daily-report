import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '@/lib/api/client';
import type { ApiResponse, UserSession } from '@/lib/api/types';

const sessionKeys = {
  all: ['sessions'] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: async () => {
      const response = await client.get<ApiResponse<UserSession[]>>(endpoints.auth.sessions);
      return response.data.data;
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      await client.delete(endpoints.auth.revokeSession(sessionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await client.delete(endpoints.auth.revokeOtherSessions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
