/**
 * Team Chat Types
 *
 * Type definitions for the 1-to-1 team messaging feature.
 */

// ============================================================================
// Database Entities
// ============================================================================

export interface Conversation {
  id: number;
  participant_one_id: number;
  participant_two_id: number;
  team_id: number;
  vanishing_mode: boolean;
  vanishing_duration_hours: number;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_vanishing: boolean;
  expires_at: Date | null;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatNotification {
  id: number;
  user_id: number;
  message_id: number;
  conversation_id: number;
  is_read: boolean;
  created_at: Date;
}

// ============================================================================
// Extended Types (with joined data)
// ============================================================================

export interface ConversationWithDetails extends Conversation {
  other_participant_id: number;
  other_participant_name: string;
  unread_count: number;
  last_message_preview: string | null;
}

export interface MessageWithSender extends Message {
  sender_name: string;
}

export interface UnreadSummary {
  conversation_id: number;
  unread_count: number;
  last_message_at: Date;
  other_participant_name: string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateConversationDto {
  participant_id: number;
}

export interface CreateMessageDto {
  content: string;
}

export interface UpdateVanishingModeDto {
  vanishing_mode: boolean;
  vanishing_duration_hours?: number;
}

export interface GetMessagesQuery {
  limit?: number;
  before?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ConversationResponse {
  id: number;
  participant_one_id: number;
  participant_two_id: number;
  team_id: number;
  vanishing_mode: boolean;
  vanishing_duration_hours: number;
  created: boolean;
}

export interface MessagesResponse {
  messages: MessageWithSender[];
  has_more: boolean;
  next_cursor: number | null;
}

// ============================================================================
// SSE Event Types
// ============================================================================

export type SSEEventType =
  | 'new_message'
  | 'message_read'
  | 'vanishing_mode_changed'
  | 'typing'
  | 'user_online'
  | 'user_offline';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

export interface NewMessageEventData {
  conversation_id: number;
  message: MessageWithSender;
}

export interface MessageReadEventData {
  conversation_id: number;
  reader_id: number;
  read_up_to_message_id: number;
}

export interface VanishingModeChangedEventData {
  conversation_id: number;
  vanishing_mode: boolean;
  vanishing_duration_hours: number;
  changed_by_id: number;
}

export interface TypingEventData {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface UserPresenceEventData {
  user_id: number;
  is_online: boolean;
  last_seen?: Date;
}
