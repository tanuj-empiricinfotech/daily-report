import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { FeedbackReceived, FeedbackSent, CreateFeedbackDto, ApiResponse } from '../../api/types';

export const useFeedbackReceived = () =>
  useQuery({
    queryKey: ['feedback', 'received'],
    queryFn: async () => {
      const res = await client.get<ApiResponse<FeedbackReceived[]>>(endpoints.feedback.received);
      return res.data.data;
    },
  });

export const useFeedbackSent = () =>
  useQuery({
    queryKey: ['feedback', 'sent'],
    queryFn: async () => {
      const res = await client.get<ApiResponse<FeedbackSent[]>>(endpoints.feedback.sent);
      return res.data.data;
    },
  });

export const useFeedbackUnreadCount = () =>
  useQuery({
    queryKey: ['feedback', 'unread-count'],
    queryFn: async () => {
      const res = await client.get<ApiResponse<{ count: number }>>(endpoints.feedback.unreadCount);
      return res.data.data.count;
    },
  });

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFeedbackDto) => {
      const res = await client.post<ApiResponse<unknown>>(endpoints.feedback.submit, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'sent'] });
    },
  });
};
