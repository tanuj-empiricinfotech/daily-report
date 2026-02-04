/**
 * Team Chat Controller
 *
 * HTTP request handlers for the team chat feature.
 * Handles conversations, messages, and real-time events.
 */

import { Response, NextFunction } from 'express';
import { ConversationsService } from '../services/conversations.service';
import { MessagesService } from '../services/messages.service';
import { AuthRequest } from '../middleware/auth';
import {
  getSSEManager,
  sendNewMessageEvent,
  sendMessageReadEvent,
  sendVanishingModeChangedEvent,
  sendTypingEvent,
} from '../services/sse-connection.service';
import type {
  CreateConversationDto,
  CreateMessageDto,
  UpdateVanishingModeDto,
  GetMessagesQuery,
} from '../types';

export class TeamChatController {
  private conversationsService: ConversationsService;
  private messagesService: MessagesService;

  constructor() {
    this.conversationsService = new ConversationsService();
    this.messagesService = new MessagesService();
  }

  /**
   * GET /api/team-chat/conversations
   * List all conversations for the current user
   */
  getConversations = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversations = await this.conversationsService.getConversations(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/team-chat/conversations
   * Create or get a conversation with another user
   */
  createConversation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { participant_id }: CreateConversationDto = req.body;

      const { conversation, created } = await this.conversationsService.getOrCreateConversation(
        userId,
        participant_id
      );

      res.status(created ? 201 : 200).json({
        success: true,
        data: {
          ...conversation,
          created,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/team-chat/conversations/:conversationId
   * Get a single conversation by ID
   */
  getConversation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = parseInt(req.params.conversationId, 10);

      const conversation = await this.conversationsService.getConversationById(
        conversationId,
        userId
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/team-chat/conversations/:conversationId/messages
   * Get messages for a conversation with pagination
   */
  getMessages = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = parseInt(req.params.conversationId, 10);
      const { limit, before } = req.query as unknown as GetMessagesQuery;

      const result = await this.messagesService.getMessages(
        conversationId,
        userId,
        limit ? parseInt(String(limit), 10) : undefined,
        before ? parseInt(String(before), 10) : undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/team-chat/conversations/:conversationId/messages
   * Send a message in a conversation
   */
  sendMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = parseInt(req.params.conversationId, 10);
      const { content }: CreateMessageDto = req.body;

      const { message, conversation } = await this.messagesService.sendMessage(
        conversationId,
        userId,
        content
      );

      // Broadcast to other participant via SSE
      await sendNewMessageEvent(conversationId, message, userId);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/team-chat/conversations/:conversationId/vanishing
   * Toggle vanishing mode for a conversation
   */
  updateVanishingMode = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = parseInt(req.params.conversationId, 10);
      const settings: UpdateVanishingModeDto = req.body;

      const conversation = await this.conversationsService.updateVanishingMode(
        conversationId,
        userId,
        settings
      );

      // Broadcast change to both participants
      await sendVanishingModeChangedEvent(
        conversationId,
        conversation.vanishing_mode,
        conversation.vanishing_duration_hours,
        userId
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/team-chat/conversations/:conversationId/read
   * Mark messages as read
   */
  markAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversationId = parseInt(req.params.conversationId, 10);
      const { up_to_message_id } = req.body;

      const count = await this.messagesService.markMessagesAsRead(
        conversationId,
        userId,
        up_to_message_id
      );

      // Broadcast read receipt to other participant
      await sendMessageReadEvent(conversationId, userId, up_to_message_id);

      res.json({
        success: true,
        data: { marked_count: count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/team-chat/conversations/:conversationId/typing
   * Send typing indicator
   */
  sendTypingIndicator = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userName = req.user!.email.split('@')[0]; // Simple name extraction
      const conversationId = parseInt(req.params.conversationId, 10);
      const { is_typing } = req.body;

      // Verify user is a participant
      await this.conversationsService.getConversationById(conversationId, userId);

      // Broadcast typing indicator
      await sendTypingEvent(conversationId, userId, userName, is_typing);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/team-chat/messages/:messageId
   * Delete a message (sender only)
   */
  deleteMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const messageId = parseInt(req.params.messageId, 10);

      await this.messagesService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/team-chat/notifications/unread
   * Get unread notification count and summary
   */
  getUnreadNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const [totalCount, summary] = await Promise.all([
        this.conversationsService.getTotalUnreadCount(userId),
        this.conversationsService.getUnreadSummary(userId),
      ]);

      res.json({
        success: true,
        data: {
          total_unread: totalCount,
          conversations: summary,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/team-chat/events
   * SSE endpoint for real-time events
   */
  subscribeToEvents = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection event
      res.write(`event: connected\ndata: {"user_id": ${userId}}\n\n`);

      // Register connection
      const sseManager = getSSEManager();
      sseManager.addConnection(userId, res);

      // Keep connection alive
      res.flushHeaders();
    } catch (error) {
      next(error);
    }
  };
}
