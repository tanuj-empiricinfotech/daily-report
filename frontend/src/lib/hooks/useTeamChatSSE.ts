/**
 * Team Chat SSE Hook
 *
 * Manages Server-Sent Events connection for real-time chat updates.
 * Handles connection, reconnection, and event dispatching to Redux.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { endpoints } from '@/lib/api/endpoints';
import type { RootState } from '@/store/store';
import {
  addMessage,
  addConversation,
  updateConversation,
  setTypingUser,
  setConnectionStatus,
  incrementUnreadCount,
  updateLastMessage,
  setActiveConversation,
  type Message,
  type Conversation,
} from '@/store/slices/teamChatSlice';

// ============================================================================
// Constants
// ============================================================================

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff
const MAX_RECONNECT_ATTEMPTS = 10;

// ============================================================================
// Browser Notification Helpers
// ============================================================================

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

const showBrowserNotification = (
  title: string,
  body: string,
  onClick?: () => void
): void => {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: 'team-chat-message',
  } as NotificationOptions);

  notification.onclick = () => {
    window.focus();
    notification.close();
    onClick?.();
  };

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
};

// ============================================================================
// SSE Event Types
// ============================================================================

interface SSENewMessageEvent {
  conversation_id: number;
  message: Message;
}

interface SSEMessageReadEvent {
  conversation_id: number;
  reader_id: number;
  read_up_to_message_id: number;
}

interface SSEVanishingModeEvent {
  conversation_id: number;
  vanishing_mode: boolean;
  vanishing_duration_hours: number;
  changed_by_id: number;
}

interface SSETypingEvent {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useTeamChatSSE(enabled: boolean = true) {
  const dispatch = useDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingConversationsRef = useRef<Set<number>>(new Set());

  const { activeConversationId, isMuted, conversations } = useSelector(
    (state: RootState) => state.teamChat
  );

  // Handle new message event
  const handleNewMessage = useCallback(
    async (data: SSENewMessageEvent) => {
      const { conversation_id, message } = data;

      // Check if conversation exists in Redux
      const conversationExists = conversations.some(c => c.id === conversation_id);

      // Fetch conversation if it doesn't exist (and not already fetching)
      if (!conversationExists && !fetchingConversationsRef.current.has(conversation_id)) {
        fetchingConversationsRef.current.add(conversation_id);
        try {
          const response = await fetch(endpoints.teamChat.conversation(conversation_id), {
            credentials: 'include',
          });
          if (response.ok) {
            const result = await response.json();
            dispatch(addConversation(result.data as Conversation));
          }
        } catch (error) {
          console.error('Failed to fetch new conversation:', error);
        } finally {
          fetchingConversationsRef.current.delete(conversation_id);
        }
      }

      // Add message to store
      dispatch(addMessage(message));

      // Update conversation's last message
      dispatch(
        updateLastMessage({
          conversationId: conversation_id,
          preview: message.content.substring(0, 100),
          timestamp: message.created_at,
        })
      );

      // Increment unread if not the active conversation
      const isActiveConversation = conversation_id === activeConversationId;
      if (!isActiveConversation) {
        dispatch(incrementUnreadCount(conversation_id));
      }

      // Show browser notification only if not viewing this conversation
      if (!isMuted && !isActiveConversation) {
        const senderName = message.sender_name || 'Someone';
        // Re-check conversations as we may have just fetched it
        const conversation = conversations.find(c => c.id === conversation_id);
        const title = conversation?.other_participant_name || senderName;
        const body = message.content.length > 100
          ? message.content.substring(0, 100) + '...'
          : message.content;

        showBrowserNotification(title, body, () => {
          // Focus the conversation when notification is clicked
          dispatch(setActiveConversation(conversation_id));
        });
      }
    },
    [dispatch, activeConversationId, isMuted, conversations]
  );

  // Handle message read event
  const handleMessageRead = useCallback(
    (data: SSEMessageReadEvent) => {
      // Could update read receipts UI if needed
      console.log('Message read:', data);
    },
    []
  );

  // Handle vanishing mode change
  const handleVanishingModeChanged = useCallback(
    (data: SSEVanishingModeEvent) => {
      dispatch(
        updateConversation({
          id: data.conversation_id,
          vanishing_mode: data.vanishing_mode,
          vanishing_duration_hours: data.vanishing_duration_hours,
        })
      );
    },
    [dispatch]
  );

  // Handle typing indicator
  const handleTyping = useCallback(
    (data: SSETypingEvent) => {
      dispatch(
        setTypingUser({
          userId: data.user_id,
          conversationId: data.conversation_id,
          isTyping: data.is_typing,
        })
      );
    },
    [dispatch]
  );

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    dispatch(setConnectionStatus('connecting'));

    const eventSource = new EventSource(endpoints.teamChat.events, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log('SSE: Connected');
      dispatch(setConnectionStatus('connected'));
      reconnectAttemptRef.current = 0;

      // Request notification permission
      requestNotificationPermission();
    };

    eventSource.onerror = () => {
      console.log('SSE: Connection error');
      eventSource.close();
      eventSourceRef.current = null;
      dispatch(setConnectionStatus('disconnected'));

      // Attempt reconnection with backoff
      if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAYS[
          Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
        ];
        console.log(`SSE: Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);

        dispatch(setConnectionStatus('reconnecting'));
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current++;
          connect();
        }, delay);
      }
    };

    // Handle connected event
    eventSource.addEventListener('connected', (event) => {
      console.log('SSE: Received connected event', event.data);
    });

    // Handle new message
    eventSource.addEventListener('new_message', (event) => {
      try {
        const data = JSON.parse(event.data) as SSENewMessageEvent;
        handleNewMessage(data);
      } catch (error) {
        console.error('SSE: Error parsing new_message event', error);
      }
    });

    // Handle message read
    eventSource.addEventListener('message_read', (event) => {
      try {
        const data = JSON.parse(event.data) as SSEMessageReadEvent;
        handleMessageRead(data);
      } catch (error) {
        console.error('SSE: Error parsing message_read event', error);
      }
    });

    // Handle vanishing mode change
    eventSource.addEventListener('vanishing_mode_changed', (event) => {
      try {
        const data = JSON.parse(event.data) as SSEVanishingModeEvent;
        handleVanishingModeChanged(data);
      } catch (error) {
        console.error('SSE: Error parsing vanishing_mode_changed event', error);
      }
    });

    // Handle typing indicator
    eventSource.addEventListener('typing', (event) => {
      try {
        const data = JSON.parse(event.data) as SSETypingEvent;
        handleTyping(data);
      } catch (error) {
        console.error('SSE: Error parsing typing event', error);
      }
    });

    eventSourceRef.current = eventSource;
  }, [dispatch, handleNewMessage, handleMessageRead, handleVanishingModeChanged, handleTyping]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    dispatch(setConnectionStatus('disconnected'));
  }, [dispatch]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connect,
    disconnect,
  };
}

export default useTeamChatSSE;
