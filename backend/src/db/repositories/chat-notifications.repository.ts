/**
 * Chat Notifications Repository
 *
 * Data access layer for chat notification management.
 * Tracks unread message state for notification badges.
 */

import { BaseRepository } from './base.repository';
import { query } from '../connection';
import type { ChatNotification, UnreadSummary } from '../../types';

export class ChatNotificationsRepository extends BaseRepository<ChatNotification> {
  protected tableName = 'chat_notifications';

  /**
   * Create a notification for a message recipient
   */
  async create(
    userId: number,
    messageId: number,
    conversationId: number
  ): Promise<ChatNotification> {
    const result = await query(
      `INSERT INTO ${this.tableName}
       (user_id, message_id, conversation_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, message_id) DO NOTHING
       RETURNING *`,
      [userId, messageId, conversationId]
    );

    return result.rows[0];
  }

  /**
   * Mark notifications as read for a conversation
   */
  async markAsRead(userId: number, conversationId: number): Promise<number> {
    const result = await query(
      `UPDATE ${this.tableName}
       SET is_read = TRUE
       WHERE user_id = $1
         AND conversation_id = $2
         AND is_read = FALSE
       RETURNING id`,
      [userId, conversationId]
    );

    return result.rowCount || 0;
  }

  /**
   * Get total unread count for a user
   */
  async getTotalUnreadCount(userId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM ${this.tableName}
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get unread count per conversation for a user
   */
  async getUnreadByConversation(userId: number): Promise<Map<number, number>> {
    const result = await query(
      `SELECT conversation_id, COUNT(*) as count
       FROM ${this.tableName}
       WHERE user_id = $1 AND is_read = FALSE
       GROUP BY conversation_id`,
      [userId]
    );

    const unreadMap = new Map<number, number>();
    for (const row of result.rows) {
      unreadMap.set(row.conversation_id, parseInt(row.count, 10));
    }

    return unreadMap;
  }

  /**
   * Get unread summary with conversation details
   */
  async getUnreadSummary(userId: number): Promise<UnreadSummary[]> {
    const result = await query(
      `SELECT
        c.id as conversation_id,
        COUNT(cn.id)::integer as unread_count,
        MAX(m.created_at) as last_message_at,
        CASE
          WHEN c.participant_one_id = $1 THEN u2.name
          ELSE u1.name
        END as other_participant_name
      FROM chat_notifications cn
      JOIN conversations c ON cn.conversation_id = c.id
      JOIN messages m ON cn.message_id = m.id
      JOIN users u1 ON c.participant_one_id = u1.id
      JOIN users u2 ON c.participant_two_id = u2.id
      WHERE cn.user_id = $1 AND cn.is_read = FALSE
      GROUP BY c.id, u1.name, u2.name
      ORDER BY last_message_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Delete notifications for deleted messages
   * Called when messages are deleted (e.g., vanishing messages)
   */
  async deleteByMessageIds(messageIds: number[]): Promise<number> {
    if (messageIds.length === 0) return 0;

    const placeholders = messageIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query(
      `DELETE FROM ${this.tableName}
       WHERE message_id IN (${placeholders})
       RETURNING id`,
      messageIds
    );

    return result.rowCount || 0;
  }

  /**
   * Delete all notifications for a conversation
   */
  async deleteByConversationId(conversationId: number): Promise<number> {
    const result = await query(
      `DELETE FROM ${this.tableName}
       WHERE conversation_id = $1
       RETURNING id`,
      [conversationId]
    );

    return result.rowCount || 0;
  }
}
