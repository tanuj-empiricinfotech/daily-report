import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { DailyLog, CreateLogDto, UpdateLogDto, ApiResponse } from '../../api/types';

export const useMyLogs = (date?: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['logs', 'my', date, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (date) params.date = date;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await client.get<ApiResponse<DailyLog[]>>(endpoints.logs.getMyLogs, { params });
      return response.data.data;
    },
  });
};

export const useTeamLogs = (teamId: number | null, filters?: { date?: string; startDate?: string; endDate?: string; userId?: number; projectId?: number }) => {
  return useQuery({
    queryKey: ['logs', 'team', teamId, filters],
    queryFn: async () => {
      if (!teamId) return [];
      const response = await client.get<ApiResponse<DailyLog[]>>(endpoints.logs.getTeamLogs(teamId), { params: filters });
      return response.data.data;
    },
    enabled: !!teamId,
  });
};

export const useCreateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLogDto) => {
      const response = await client.post<ApiResponse<DailyLog>>(endpoints.logs.create, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useCreateLogsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLogDto[]) => {
      const response = await client.post<ApiResponse<DailyLog[]>>(endpoints.logs.createBulk, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useUpdateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLogDto }) => {
      const response = await client.put<ApiResponse<DailyLog>>(endpoints.logs.update(id), data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await client.delete(endpoints.logs.delete(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

