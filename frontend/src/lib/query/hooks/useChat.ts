/**
 * Chat Query Hooks
 *
 * React Query hooks for chat-related API operations
 */

import { useQuery } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { ApiResponse, ChatContextMetadata } from '../../api/types';

interface ChatContextParams {
  startDate?: string;
  endDate?: string;
  targetUserId?: number;
}

/**
 * Hook to fetch chat context metadata
 * Returns information about logs loaded for chat context
 */
export const useChatContext = (params?: ChatContextParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chat', 'context', params?.startDate, params?.endDate, params?.targetUserId],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {};
      if (params?.startDate) queryParams.startDate = params.startDate;
      if (params?.endDate) queryParams.endDate = params.endDate;
      if (params?.targetUserId) queryParams.targetUserId = params.targetUserId;

      const response = await client.get<ApiResponse<ChatContextMetadata>>(
        endpoints.chat.getContext,
        { params: queryParams }
      );
      return response.data.data;
    },
    enabled,
  });
};
