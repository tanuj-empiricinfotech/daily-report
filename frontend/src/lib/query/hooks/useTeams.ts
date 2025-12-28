import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { Team, CreateTeamDto, ApiResponse } from '../../api/types';
import { useDispatch } from 'react-redux';
import { setTeams, addTeam, updateTeam, removeTeam } from '../../../store/slices/teamsSlice';

export const useTeams = () => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await client.get<ApiResponse<Team[]>>(endpoints.teams.list);
      dispatch(setTeams(response.data.data));
      return response.data.data;
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: CreateTeamDto) => {
      const response = await client.post<ApiResponse<Team>>(endpoints.teams.create, data);
      return response.data.data;
    },
    onSuccess: (team) => {
      dispatch(addTeam(team));
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateTeamDto> }) => {
      const response = await client.put<ApiResponse<Team>>(endpoints.teams.update(id), data);
      return response.data.data;
    },
    onSuccess: (team) => {
      dispatch(updateTeam(team));
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (id: number) => {
      await client.delete(endpoints.teams.delete(id));
      return id;
    },
    onSuccess: (id) => {
      dispatch(removeTeam(id));
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

