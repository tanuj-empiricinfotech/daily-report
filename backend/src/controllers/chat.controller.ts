/**
 * Chat Controller
 *
 * Handles HTTP requests for AI-powered chat functionality.
 * Streams AI responses using Vercel AI SDK format.
 */

import { Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { AuthRequest } from '../middleware/auth';
import type { ChatMessage, ChatRequest } from '../lib/ai';
import { istToIso } from '../utils/date';

// Type for content parts from assistant-ui
interface ContentPart {
  type: string;
  text?: string;
}

// Type for incoming message with flexible content format
// assistant-ui sends "parts" instead of "content"
interface IncomingMessage {
  role: string;
  content?: string | ContentPart[];
  parts?: ContentPart[];
  id?: string;
  metadata?: unknown;
}

/**
 * Extract text content from parts array
 */
function extractTextFromParts(parts: ContentPart[]): string {
  return parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => part.text)
    .join('');
}

/**
 * Extract text content from a message
 * Handles multiple formats:
 * - string content
 * - content as array of parts
 * - parts array (assistant-ui format)
 */
function extractMessageContent(msg: IncomingMessage): string {
  // Handle "parts" array (assistant-ui format)
  if (Array.isArray(msg.parts)) {
    return extractTextFromParts(msg.parts);
  }

  // Handle "content" as string
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  // Handle "content" as array of parts
  if (Array.isArray(msg.content)) {
    return extractTextFromParts(msg.content);
  }

  return '';
}

/**
 * Normalize incoming messages to our ChatMessage format
 */
function normalizeMessages(messages: IncomingMessage[]): ChatMessage[] {
  return messages
    .filter(msg => ['user', 'assistant', 'system'].includes(msg.role))
    .map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: extractMessageContent(msg),
    }))
    .filter(msg => msg.content.length > 0);
}

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Handle chat requests with streaming responses
   * POST /api/chat
   *
   * Request body:
   * {
   *   messages: Array<{ role: 'user' | 'assistant', content: string | ContentPart[] }>,
   *   context?: {
   *     startDate?: string,
   *     endDate?: string,
   *     targetUserId?: number
   *   }
   * }
   */
  chat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messages: rawMessages, context }: { messages: IncomingMessage[]; context?: ChatRequest['context'] } = req.body;
      const authenticatedUserId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';

      // Validate messages array exists
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Messages array is required and must not be empty',
        });
        return;
      }

      // Validate basic message structure
      // assistant-ui sends "parts" instead of "content"
      const hasValidStructure = rawMessages.every(
        msg =>
          typeof msg === 'object' &&
          msg !== null &&
          typeof msg.role === 'string' &&
          (typeof msg.content === 'string' || Array.isArray(msg.content) || Array.isArray(msg.parts))
      );

      if (!hasValidStructure) {
        res.status(400).json({
          success: false,
          error: 'Invalid message format. Each message must have role and content.',
        });
        return;
      }

      // Normalize messages to our format
      const messages = normalizeMessages(rawMessages);

      if (messages.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid messages found after normalization.',
        });
        return;
      }

      // Convert IST dates to ISO for querying
      const contextOptions = context
        ? {
            startDate: context.startDate ? istToIso(context.startDate) : undefined,
            endDate: context.endDate ? istToIso(context.endDate) : undefined,
            targetUserId: context.targetUserId,
          }
        : undefined;

      // Stream the chat response
      const result = await this.chatService.streamChat(
        messages,
        authenticatedUserId,
        isAdmin,
        contextOptions
      );

      // Use Vercel AI SDK's UI message stream format (what assistant-ui expects)
      const response = result.toUIMessageStreamResponse();

      // Copy headers from the AI SDK response
      response.headers.forEach((value: string, key: string) => {
        res.setHeader(key, value);
      });

      // Set status and pipe the body
      res.status(response.status);

      if (response.body) {
        const reader = response.body.getReader();
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(value);
          return pump();
        };
        await pump();
      } else {
        res.end();
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get chat context metadata
   * GET /api/chat/context
   *
   * Query params:
   * - startDate?: string
   * - endDate?: string
   * - targetUserId?: number
   */
  getContext = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUserId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';

      // Parse query params
      const startDate = req.query.startDate
        ? istToIso(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? istToIso(req.query.endDate as string)
        : undefined;
      const targetUserId = req.query.targetUserId
        ? parseInt(req.query.targetUserId as string, 10)
        : undefined;

      const metadata = await this.chatService.getChatContextMetadata(
        authenticatedUserId,
        isAdmin,
        targetUserId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      next(error);
    }
  };
}
