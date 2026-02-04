/**
 * Team Chat Redux Slice
 *
 * State management for 1-to-1 team messaging feature.
 * Handles conversations, messages, presence, and notifications.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// Types
// ============================================================================

export interface Conversation {
  id: number;
  participant_one_id: number;
  participant_two_id: number;
  team_id: number;
  vanishing_mode: boolean;
  vanishing_duration_hours: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Extended fields from API
  other_participant_id?: number;
  other_participant_name?: string;
  unread_count?: number;
  last_message_preview?: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  is_vanishing: boolean;
  expires_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  // For optimistic updates
  status?: 'pending' | 'sent' | 'failed';
  local_id?: string;
}

export interface ChatNotification {
  id: string;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  message_preview: string;
  timestamp: string;
  dismissed: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// ============================================================================
// State Interface
// ============================================================================

interface TeamChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: number | null;
  conversationsLoading: boolean;

  // Messages (keyed by conversation ID)
  messagesByConversation: Record<number, {
    messages: Message[];
    hasMore: boolean;
    isLoading: boolean;
  }>;

  // Draft messages (keyed by conversation ID)
  drafts: Record<number, string>;

  // Pending/optimistic messages
  pendingMessages: Record<string, Message>;

  // Presence
  onlineUsers: Record<number, boolean>;
  typingUsers: Record<number, { conversationId: number; timestamp: number }>;
  connectionStatus: ConnectionStatus;

  // Notifications
  notifications: ChatNotification[];
  totalUnreadCount: number;
  isMuted: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: TeamChatState = {
  conversations: [],
  activeConversationId: null,
  conversationsLoading: false,

  messagesByConversation: {},
  drafts: {},
  pendingMessages: {},

  onlineUsers: {},
  typingUsers: {},
  connectionStatus: 'disconnected',

  notifications: [],
  totalUnreadCount: 0,
  isMuted: false,
};

// ============================================================================
// Slice
// ============================================================================

const teamChatSlice = createSlice({
  name: 'teamChat',
  initialState,
  reducers: {
    // ========================================
    // Conversation Actions
    // ========================================

    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
      state.conversationsLoading = false;
    },

    setConversationsLoading(state, action: PayloadAction<boolean>) {
      state.conversationsLoading = action.payload;
    },

    addConversation(state, action: PayloadAction<Conversation>) {
      const exists = state.conversations.some(c => c.id === action.payload.id);
      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },

    updateConversation(state, action: PayloadAction<Partial<Conversation> & { id: number }>) {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload };
      }
    },

    setActiveConversation(state, action: PayloadAction<number | null>) {
      state.activeConversationId = action.payload;
      // Clear unread count when opening a conversation
      if (action.payload !== null) {
        const conversation = state.conversations.find(c => c.id === action.payload);
        if (conversation) {
          state.totalUnreadCount -= (conversation.unread_count || 0);
          conversation.unread_count = 0;
        }
      }
    },

    updateLastMessage(state, action: PayloadAction<{
      conversationId: number;
      preview: string;
      timestamp: string;
    }>) {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.last_message_preview = action.payload.preview;
        conversation.last_message_at = action.payload.timestamp;
        // Move conversation to top
        const index = state.conversations.indexOf(conversation);
        if (index > 0) {
          state.conversations.splice(index, 1);
          state.conversations.unshift(conversation);
        }
      }
    },

    incrementUnreadCount(state, action: PayloadAction<number>) {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation && state.activeConversationId !== action.payload) {
        conversation.unread_count = (conversation.unread_count || 0) + 1;
        state.totalUnreadCount += 1;
      }
    },

    // ========================================
    // Message Actions
    // ========================================

    setMessages(state, action: PayloadAction<{
      conversationId: number;
      messages: Message[];
      hasMore: boolean;
    }>) {
      state.messagesByConversation[action.payload.conversationId] = {
        messages: action.payload.messages,
        hasMore: action.payload.hasMore,
        isLoading: false,
      };
    },

    appendMessages(state, action: PayloadAction<{
      conversationId: number;
      messages: Message[];
      hasMore: boolean;
    }>) {
      const existing = state.messagesByConversation[action.payload.conversationId];
      if (existing) {
        existing.messages = [...action.payload.messages, ...existing.messages];
        existing.hasMore = action.payload.hasMore;
        existing.isLoading = false;
      }
    },

    addMessage(state, action: PayloadAction<Message>) {
      const { conversation_id } = action.payload;
      const existing = state.messagesByConversation[conversation_id];
      if (existing) {
        // Check for duplicate
        const isDuplicate = existing.messages.some(m => m.id === action.payload.id);
        if (!isDuplicate) {
          existing.messages.push(action.payload);
        }
      } else {
        state.messagesByConversation[conversation_id] = {
          messages: [action.payload],
          hasMore: true,
          isLoading: false,
        };
      }
    },

    setMessagesLoading(state, action: PayloadAction<{ conversationId: number; isLoading: boolean }>) {
      const existing = state.messagesByConversation[action.payload.conversationId];
      if (existing) {
        existing.isLoading = action.payload.isLoading;
      } else {
        state.messagesByConversation[action.payload.conversationId] = {
          messages: [],
          hasMore: true,
          isLoading: action.payload.isLoading,
        };
      }
    },

    // Optimistic message handling
    addPendingMessage(state, action: PayloadAction<Message>) {
      const localId = action.payload.local_id;
      if (localId) {
        state.pendingMessages[localId] = action.payload;
        // Also add to messages list
        const { conversation_id } = action.payload;
        const existing = state.messagesByConversation[conversation_id];
        if (existing) {
          existing.messages.push(action.payload);
        }
      }
    },

    confirmPendingMessage(state, action: PayloadAction<{ localId: string; message: Message }>) {
      const { localId, message } = action.payload;
      delete state.pendingMessages[localId];

      // Replace pending message with confirmed one
      const existing = state.messagesByConversation[message.conversation_id];
      if (existing) {
        const index = existing.messages.findIndex(m => m.local_id === localId);
        if (index !== -1) {
          existing.messages[index] = message;
        }
      }
    },

    markPendingMessageFailed(state, action: PayloadAction<string>) {
      const pending = state.pendingMessages[action.payload];
      if (pending) {
        pending.status = 'failed';
        // Update in messages list too
        const existing = state.messagesByConversation[pending.conversation_id];
        if (existing) {
          const msg = existing.messages.find(m => m.local_id === action.payload);
          if (msg) {
            msg.status = 'failed';
          }
        }
      }
    },

    // ========================================
    // Draft Actions
    // ========================================

    setDraft(state, action: PayloadAction<{ conversationId: number; content: string }>) {
      if (action.payload.content) {
        state.drafts[action.payload.conversationId] = action.payload.content;
      } else {
        delete state.drafts[action.payload.conversationId];
      }
    },

    clearDraft(state, action: PayloadAction<number>) {
      delete state.drafts[action.payload];
    },

    // ========================================
    // Presence Actions
    // ========================================

    setUserOnline(state, action: PayloadAction<{ userId: number; isOnline: boolean }>) {
      state.onlineUsers[action.payload.userId] = action.payload.isOnline;
    },

    setTypingUser(state, action: PayloadAction<{
      userId: number;
      conversationId: number;
      isTyping: boolean;
    }>) {
      if (action.payload.isTyping) {
        state.typingUsers[action.payload.userId] = {
          conversationId: action.payload.conversationId,
          timestamp: Date.now(),
        };
      } else {
        delete state.typingUsers[action.payload.userId];
      }
    },

    setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.connectionStatus = action.payload;
    },

    // ========================================
    // Notification Actions
    // ========================================

    addNotification(state, action: PayloadAction<ChatNotification>) {
      state.notifications.unshift(action.payload);
      // Keep only last 10 notifications
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(0, 10);
      }
    },

    dismissNotification(state, action: PayloadAction<string>) {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.dismissed = true;
      }
    },

    clearNotifications(state) {
      state.notifications = [];
    },

    setTotalUnreadCount(state, action: PayloadAction<number>) {
      state.totalUnreadCount = action.payload;
    },

    setMuted(state, action: PayloadAction<boolean>) {
      state.isMuted = action.payload;
    },

    // ========================================
    // Reset
    // ========================================

    resetTeamChat() {
      return initialState;
    },
  },
});

export const {
  // Conversations
  setConversations,
  setConversationsLoading,
  addConversation,
  updateConversation,
  setActiveConversation,
  updateLastMessage,
  incrementUnreadCount,

  // Messages
  setMessages,
  appendMessages,
  addMessage,
  setMessagesLoading,
  addPendingMessage,
  confirmPendingMessage,
  markPendingMessageFailed,

  // Drafts
  setDraft,
  clearDraft,

  // Presence
  setUserOnline,
  setTypingUser,
  setConnectionStatus,

  // Notifications
  addNotification,
  dismissNotification,
  clearNotifications,
  setTotalUnreadCount,
  setMuted,

  // Reset
  resetTeamChat,
} = teamChatSlice.actions;

export default teamChatSlice.reducer;
