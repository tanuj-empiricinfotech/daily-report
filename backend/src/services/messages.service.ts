/**
 * Messages Service
 *
 * Business logic for message management.
 * Handles sending, retrieving, and managing chat messages.
 */

import { MessagesRepository } from '../db/repositories/messages.repository';
import { ConversationsRepository } from '../db/repositories/conversations.repository';
import { ChatNotificationsRepository } from '../db/repositories/chat-notifications.repository';
import type {
  Message,
  MessageWithSender,
  MessagesResponse,
  Conversation,
} from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { MAX_MESSAGE_LENGTH, MESSAGES_PER_PAGE } from '../config/jobs.config';

export class MessagesService {
  private messagesRepository: MessagesRepository;
  private conversationsRepository: ConversationsRepository;
  private notificationsRepository: ChatNotificationsRepository;

  constructor() {
    this.messagesRepository = new MessagesRepository();
    this.conversationsRepository = new ConversationsRepository();
    this.notificationsRepository = new ChatNotificationsRepository();
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
    replyToMessageId?: number
  ): Promise<{ message: MessageWithSender; conversation: Conversation }> {
    // Validate content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestError('Message content cannot be empty');
    }
    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestError(
        `Message content cannot exceed ${MAX_MESSAGE_LENGTH} characters`
      );
    }

    // Verify sender is a participant
    const conversation = await this.conversationsRepository.findByIdForUser(
      conversationId,
      senderId
    );
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Validate reply_to_message_id if provided
    if (replyToMessageId) {
      const replyToMessage = await this.messagesRepository.findById(replyToMessageId);
      if (!replyToMessage || replyToMessage.conversation_id !== conversationId) {
        throw new BadRequestError('Invalid reply message');
      }
    }

    // Calculate expiration for vanishing messages
    let expiresAt: Date | null = null;
    if (conversation.vanishing_mode) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + conversation.vanishing_duration_hours);
    }

    // Create the message
    const message = await this.messagesRepository.create(
      conversationId,
      senderId,
      trimmedContent,
      conversation.vanishing_mode,
      expiresAt,
      replyToMessageId
    );

    // Update conversation's last message timestamp
    await this.conversationsRepository.updateLastMessageAt(conversationId);

    // Create notification for the recipient
    const recipientId = this.conversationsRepository.getOtherParticipantId(
      conversation,
      senderId
    );
    await this.notificationsRepository.create(
      recipientId,
      message.id,
      conversationId
    );

    // Get message with sender details
    const messageWithSender = await this.messagesRepository.findByIdWithSender(
      message.id
    );
    if (!messageWithSender) {
      throw new NotFoundError('Message not found after creation');
    }

    return { message: messageWithSender, conversation };
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: number,
    userId: number,
    limit?: number,
    beforeMessageId?: number
  ): Promise<MessagesResponse> {
    // Verify user is a participant
    const conversation = await this.conversationsRepository.findByIdForUser(
      conversationId,
      userId
    );
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const effectiveLimit = Math.min(limit || MESSAGES_PER_PAGE, 100);
    const { messages, hasMore } = await this.messagesRepository.findByConversationId(
      conversationId,
      effectiveLimit,
      beforeMessageId
    );

    const nextCursor = hasMore && messages.length > 0 ? messages[0].id : null;

    return {
      messages,
      has_more: hasMore,
      next_cursor: nextCursor,
    };
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: number,
    userId: number,
    upToMessageId: number
  ): Promise<number> {
    // Verify user is a participant
    const conversation = await this.conversationsRepository.findByIdForUser(
      conversationId,
      userId
    );
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Mark messages as read in the messages table
    await this.messagesRepository.markAsRead(conversationId, userId, upToMessageId);

    // Mark notifications as read
    return await this.notificationsRepository.markAsRead(userId, conversationId);
  }

  /**
   * Delete a message (sender only)
   */
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    const message = await this.messagesRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    return await this.messagesRepository.deleteByIdAndSender(messageId, userId);
  }

  /**
   * Delete expired vanishing messages
   * Called by the cleanup job
   */
  async cleanupExpiredMessages(): Promise<number> {
    return await this.messagesRepository.deleteExpiredVanishingMessages();
  }

  /**
   * Get a message by ID with authorization check
   */
  async getMessageById(
    messageId: number,
    userId: number
  ): Promise<MessageWithSender> {
    const message = await this.messagesRepository.findByIdWithSender(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is a participant of the conversation
    const conversation = await this.conversationsRepository.findByIdForUser(
      message.conversation_id,
      userId
    );
    if (!conversation) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    return message;
  }
}
