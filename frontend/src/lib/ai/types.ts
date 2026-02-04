/**
 * Chat and AI Type Definitions for Frontend
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContextOptions {
  startDate?: string;
  endDate?: string;
  targetUserId?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: ChatContextOptions;
}

export interface ChatContextMetadata {
  userId: number;
  userName: string;
  logCount: number;
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
}
