/**
 * Conversations Repository
 *
 * Data access layer for conversation management.
 * Handles CRUD operations for 1-to-1 chat conversations.
 */

import { BaseRepository } from './base.repository';
import { query } from '../connection';
import type {
  Conversation,
  ConversationWithDetails,
  CreateConversationDto,
  UpdateVanishingModeDto,
} from '../../types';
import { DEFAULT_VANISHING_DURATION_HOURS } from '../../config/jobs.config';

export class ConversationsRepository extends BaseRepository<Conversation> {
  protected tableName = 'conversations';

  /**
   * Find or create a conversation between two users
   * Ensures participant IDs are ordered correctly (lower ID first)
   */
  async findOrCreate(
    userId: number,
    participantId: number,
    teamId: number
  ): Promise<{ conversation: Conversation; created: boolean }> {
    // Ensure consistent ordering
    const participantOneId = Math.min(userId, participantId);
    const participantTwoId = Math.max(userId, participantId);

    // Try to find existing conversation
    const existing = await query(
      `SELECT * FROM ${this.tableName}
       WHERE participant_one_id = $1 AND participant_two_id = $2`,
      [participantOneId, participantTwoId]
    );

    if (existing.rows[0]) {
      return { conversation: existing.rows[0], created: false };
    }

    // Create new conversation with vanishing mode enabled by default
    const result = await query(
      `INSERT INTO ${this.tableName}
       (participant_one_id, participant_two_id, team_id, vanishing_mode, vanishing_duration_hours)
       VALUES ($1, $2, $3, TRUE, $4)
       RETURNING *`,
      [participantOneId, participantTwoId, teamId, DEFAULT_VANISHING_DURATION_HOURS]
    );

    return { conversation: result.rows[0], created: true };
  }

  /**
   * Find all conversations for a user with details
   * Includes other participant info, unread count, and last message preview
   */
  async findByUserIdWithDetails(userId: number): Promise<ConversationWithDetails[]> {
    const result = await query(
      `SELECT
        c.*,
        CASE
          WHEN c.participant_one_id = $1 THEN c.participant_two_id
          ELSE c.participant_one_id
        END as other_participant_id,
        CASE
          WHEN c.participant_one_id = $1 THEN u2.name
          ELSE u1.name
        END as other_participant_name,
        COALESCE(unread.count, 0)::integer as unread_count,
        last_msg.content as last_message_preview
      FROM ${this.tableName} c
      JOIN users u1 ON c.participant_one_id = u1.id
      JOIN users u2 ON c.participant_two_id = u2.id
      LEFT JOIN (
        SELECT conversation_id, COUNT(*) as count
        FROM chat_notifications
        WHERE user_id = $1 AND is_read = FALSE
        GROUP BY conversation_id
      ) unread ON unread.conversation_id = c.id
      LEFT JOIN LATERAL (
        SELECT content FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON true
      WHERE c.participant_one_id = $1 OR c.participant_two_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Find a conversation by ID with participant validation
   */
  async findByIdForUser(
    conversationId: number,
    userId: number
  ): Promise<Conversation | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName}
       WHERE id = $1 AND (participant_one_id = $2 OR participant_two_id = $2)`,
      [conversationId, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get the other participant's ID in a conversation
   */
  getOtherParticipantId(conversation: Conversation, userId: number): number {
    return conversation.participant_one_id === userId
      ? conversation.participant_two_id
      : conversation.participant_one_id;
  }

  /**
   * Update vanishing mode settings
   */
  async updateVanishingMode(
    conversationId: number,
    settings: UpdateVanishingModeDto
  ): Promise<Conversation | null> {
    const result = await query(
      `UPDATE ${this.tableName}
       SET vanishing_mode = $1,
           vanishing_duration_hours = COALESCE($2, vanishing_duration_hours)
       WHERE id = $3
       RETURNING *`,
      [
        settings.vanishing_mode,
        settings.vanishing_duration_hours,
        conversationId,
      ]
    );

    return result.rows[0] || null;
  }

  /**
   * Update last message timestamp
   */
  async updateLastMessageAt(conversationId: number): Promise<void> {
    await query(
      `UPDATE ${this.tableName}
       SET last_message_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [conversationId]
    );
  }

  /**
   * Check if two users are in the same team
   */
  async areUsersInSameTeam(userId1: number, userId2: number): Promise<boolean> {
    const result = await query(
      `SELECT COUNT(*) as count FROM users
       WHERE id IN ($1, $2)
       AND team_id IS NOT NULL
       GROUP BY team_id
       HAVING COUNT(*) = 2`,
      [userId1, userId2]
    );

    return result.rows.length > 0;
  }

  /**
   * Get team ID for two users (assumes they're in the same team)
   */
  async getSharedTeamId(userId1: number, userId2: number): Promise<number | null> {
    const result = await query(
      `SELECT u1.team_id
       FROM users u1
       JOIN users u2 ON u1.team_id = u2.team_id
       WHERE u1.id = $1 AND u2.id = $2 AND u1.team_id IS NOT NULL`,
      [userId1, userId2]
    );

    return result.rows[0]?.team_id || null;
  }
}
