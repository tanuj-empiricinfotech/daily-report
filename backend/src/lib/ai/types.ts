/**
 * AI Module Type Definitions
 * Defines interfaces for chat messages, context, and provider configuration
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LogContext {
  id: number;
  date: string;
  projectName: string;
  taskDescription: string;
  actualTimeSpent: string;
  trackedTime: string;
}

export interface ChatContext {
  userId: number;
  userName: string;
  logs: LogContext[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    startDate?: string;
    endDate?: string;
    targetUserId?: number;
  };
}

export interface StreamingChatOptions {
  maxTokens?: number;
  temperature?: number;
}

export type AIProviderType = 'openai' | 'anthropic' | 'google';

export interface AIProviderConfig {
  type: AIProviderType;
  model: string;
  apiKey: string;
}
