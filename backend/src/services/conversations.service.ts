/**
 * Conversations Service
 *
 * Business logic for conversation management.
 * Handles conversation creation, retrieval, and vanishing mode settings.
 */

import { ConversationsRepository } from '../db/repositories/conversations.repository';
import { ChatNotificationsRepository } from '../db/repositories/chat-notifications.repository';
import type {
  Conversation,
  ConversationWithDetails,
  UpdateVanishingModeDto,
} from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export class ConversationsService {
  private conversationsRepository: ConversationsRepository;
  private notificationsRepository: ChatNotificationsRepository;

  constructor() {
    this.conversationsRepository = new ConversationsRepository();
    this.notificationsRepository = new ChatNotificationsRepository();
  }

  /**
   * Get all conversations for a user with details
   */
  async getConversations(userId: number): Promise<ConversationWithDetails[]> {
    return await this.conversationsRepository.findByUserIdWithDetails(userId);
  }

  /**
   * Get or create a conversation with another user
   */
  async getOrCreateConversation(
    userId: number,
    participantId: number
  ): Promise<{ conversation: Conversation; created: boolean }> {
    // Validate not creating conversation with self
    if (userId === participantId) {
      throw new BadRequestError('Cannot create a conversation with yourself');
    }

    // Validate users are in the same team
    const areInSameTeam = await this.conversationsRepository.areUsersInSameTeam(
      userId,
      participantId
    );
    if (!areInSameTeam) {
      throw new ForbiddenError('Can only chat with team members');
    }

    // Get the shared team ID
    const teamId = await this.conversationsRepository.getSharedTeamId(
      userId,
      participantId
    );
    if (!teamId) {
      throw new ForbiddenError('Users must be in the same team');
    }

    return await this.conversationsRepository.findOrCreate(
      userId,
      participantId,
      teamId
    );
  }

  /**
   * Get a conversation by ID with authorization check
   */
  async getConversationById(
    conversationId: number,
    userId: number
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findByIdForUser(
      conversationId,
      userId
    );

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return conversation;
  }

  /**
   * Update vanishing mode settings for a conversation
   */
  async updateVanishingMode(
    conversationId: number,
    userId: number,
    settings: UpdateVanishingModeDto
  ): Promise<Conversation> {
    // Verify user is a participant
    const conversation = await this.getConversationById(conversationId, userId);

    // Validate duration if provided
    if (settings.vanishing_duration_hours !== undefined) {
      if (settings.vanishing_duration_hours < 1 || settings.vanishing_duration_hours > 168) {
        throw new BadRequestError(
          'Vanishing duration must be between 1 and 168 hours (1 week)'
        );
      }
    }

    const updated = await this.conversationsRepository.updateVanishingMode(
      conversationId,
      settings
    );

    if (!updated) {
      throw new NotFoundError('Conversation not found');
    }

    return updated;
  }

  /**
   * Get the other participant's ID in a conversation
   */
  getOtherParticipantId(conversation: Conversation, userId: number): number {
    return this.conversationsRepository.getOtherParticipantId(conversation, userId);
  }

  /**
   * Mark all messages in a conversation as read for a user
   */
  async markConversationAsRead(
    conversationId: number,
    userId: number
  ): Promise<number> {
    // Verify user is a participant
    await this.getConversationById(conversationId, userId);

    return await this.notificationsRepository.markAsRead(userId, conversationId);
  }

  /**
   * Get total unread count for a user
   */
  async getTotalUnreadCount(userId: number): Promise<number> {
    return await this.notificationsRepository.getTotalUnreadCount(userId);
  }

  /**
   * Get unread summary for a user
   */
  async getUnreadSummary(userId: number) {
    return await this.notificationsRepository.getUnreadSummary(userId);
  }
}
