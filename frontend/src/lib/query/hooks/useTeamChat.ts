/**
 * Team Chat React Query Hooks
 *
 * Data fetching and mutation hooks for the team chat feature.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { endpoints } from '@/lib/api/endpoints';
import {
  setConversations,
  setMessages,
  appendMessages,
  updateConversation,
  confirmPendingMessage,
  markPendingMessageFailed,
  addPendingMessage,
  updateLastMessage,
  clearDraft,
  type Conversation,
  type Message,
} from '@/store/slices/teamChatSlice';

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface MessagesResponse {
  messages: Message[];
  has_more: boolean;
  next_cursor: number | null;
}

interface UnreadResponse {
  total_unread: number;
  conversations: Array<{
    conversation_id: number;
    unread_count: number;
    last_message_at: string;
    other_participant_name: string;
  }>;
}

// ============================================================================
// API Functions
// ============================================================================

const fetchWithCredentials = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// ============================================================================
// Query Keys
// ============================================================================

export const teamChatKeys = {
  all: ['teamChat'] as const,
  conversations: () => [...teamChatKeys.all, 'conversations'] as const,
  conversation: (id: number) => [...teamChatKeys.conversations(), id] as const,
  messages: (conversationId: number) => [...teamChatKeys.all, 'messages', conversationId] as const,
  unread: () => [...teamChatKeys.all, 'unread'] as const,
};

// ============================================================================
// Conversation Hooks
// ============================================================================

/**
 * Fetch all conversations for the current user
 */
export const useConversations = () => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: teamChatKeys.conversations(),
    queryFn: async () => {
      const response = await fetchWithCredentials<ApiResponse<Conversation[]>>(
        endpoints.teamChat.conversations
      );
      dispatch(setConversations(response.data));
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Create or get a conversation with another user
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: number) => {
      const response = await fetchWithCredentials<ApiResponse<Conversation & { created: boolean }>>(
        endpoints.teamChat.conversations,
        {
          method: 'POST',
          body: JSON.stringify({ participant_id: participantId }),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamChatKeys.conversations() });
    },
  });
};

// ============================================================================
// Message Hooks
// ============================================================================

/**
 * Fetch messages for a conversation with infinite scroll
 */
export const useMessages = (conversationId: number | null) => {
  const dispatch = useDispatch();

  return useInfiniteQuery({
    queryKey: teamChatKeys.messages(conversationId!),
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }) => {
      const url = new URL(endpoints.teamChat.messages(conversationId!));
      url.searchParams.set('limit', '50');
      if (pageParam) {
        url.searchParams.set('before', String(pageParam));
      }

      const response = await fetchWithCredentials<ApiResponse<MessagesResponse>>(url.toString());

      // Update Redux store
      if (pageParam) {
        dispatch(appendMessages({
          conversationId: conversationId!,
          messages: response.data.messages,
          hasMore: response.data.has_more,
        }));
      } else {
        dispatch(setMessages({
          conversationId: conversationId!,
          messages: response.data.messages,
          hasMore: response.data.has_more,
        }));
      }

      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled: !!conversationId,
    staleTime: 0, // Always fresh for real-time
  });
};

/**
 * Send a message
 */
export const useSendMessage = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      localId,
    }: {
      conversationId: number;
      content: string;
      localId: string;
    }) => {
      const response = await fetchWithCredentials<ApiResponse<Message>>(
        endpoints.teamChat.messages(conversationId),
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        }
      );
      return { message: response.data, localId };
    },
    onMutate: async ({ conversationId, content, localId }) => {
      // Optimistic update
      const pendingMessage: Message = {
        id: -Date.now(), // Temporary negative ID
        conversation_id: conversationId,
        sender_id: 0, // Will be filled by server
        content,
        is_vanishing: false,
        expires_at: null,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending',
        local_id: localId,
      };

      dispatch(addPendingMessage(pendingMessage));
      dispatch(clearDraft(conversationId));

      return { localId };
    },
    onSuccess: ({ message, localId }) => {
      dispatch(confirmPendingMessage({ localId, message }));
      dispatch(updateLastMessage({
        conversationId: message.conversation_id,
        preview: message.content.substring(0, 100),
        timestamp: message.created_at,
      }));
    },
    onError: (_error, variables) => {
      dispatch(markPendingMessageFailed(variables.localId));
    },
  });
};

/**
 * Delete a message
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      await fetchWithCredentials<ApiResponse<{ message: string }>>(
        endpoints.teamChat.deleteMessage(messageId),
        { method: 'DELETE' }
      );
      return messageId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamChatKeys.all });
    },
  });
};

// ============================================================================
// Action Hooks
// ============================================================================

/**
 * Update vanishing mode for a conversation
 */
export const useUpdateVanishingMode = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      vanishingMode,
      vanishingDurationHours,
    }: {
      conversationId: number;
      vanishingMode: boolean;
      vanishingDurationHours?: number;
    }) => {
      const response = await fetchWithCredentials<ApiResponse<Conversation>>(
        endpoints.teamChat.vanishingMode(conversationId),
        {
          method: 'PUT',
          body: JSON.stringify({
            vanishing_mode: vanishingMode,
            vanishing_duration_hours: vanishingDurationHours,
          }),
        }
      );
      return response.data;
    },
    onSuccess: (conversation) => {
      dispatch(updateConversation(conversation));
      queryClient.invalidateQueries({ queryKey: teamChatKeys.conversations() });
    },
  });
};

/**
 * Mark messages as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      upToMessageId,
    }: {
      conversationId: number;
      upToMessageId: number;
    }) => {
      await fetchWithCredentials<ApiResponse<{ marked_count: number }>>(
        endpoints.teamChat.markAsRead(conversationId),
        {
          method: 'POST',
          body: JSON.stringify({ up_to_message_id: upToMessageId }),
        }
      );
      return { conversationId, upToMessageId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamChatKeys.unread() });
    },
  });
};

/**
 * Send typing indicator
 */
export const useSendTypingIndicator = () => {
  return useMutation({
    mutationFn: async ({
      conversationId,
      isTyping,
    }: {
      conversationId: number;
      isTyping: boolean;
    }) => {
      await fetchWithCredentials<ApiResponse<{ success: boolean }>>(
        endpoints.teamChat.typing(conversationId),
        {
          method: 'POST',
          body: JSON.stringify({ is_typing: isTyping }),
        }
      );
    },
  });
};

// ============================================================================
// Notification Hooks
// ============================================================================

/**
 * Fetch unread notification count
 */
export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: teamChatKeys.unread(),
    queryFn: async () => {
      const response = await fetchWithCredentials<ApiResponse<UnreadResponse>>(
        endpoints.teamChat.unreadNotifications
      );
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
