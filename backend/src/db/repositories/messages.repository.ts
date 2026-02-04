/**
 * Messages Repository
 *
 * Data access layer for chat messages.
 * Handles CRUD operations and vanishing message cleanup.
 */

import { BaseRepository } from './base.repository';
import { query } from '../connection';
import type { Message, MessageWithSender, CreateMessageDto } from '../../types';
import { MESSAGES_PER_PAGE } from '../../config/jobs.config';

export class MessagesRepository extends BaseRepository<Message> {
  protected tableName = 'messages';

  /**
   * Create a new message
   */
  async create(
    conversationId: number,
    senderId: number,
    content: string,
    isVanishing: boolean,
    expiresAt: Date | null,
    replyToMessageId?: number
  ): Promise<Message> {
    const result = await query(
      `INSERT INTO ${this.tableName}
       (conversation_id, sender_id, content, is_vanishing, expires_at, reply_to_message_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [conversationId, senderId, content, isVanishing, expiresAt, replyToMessageId || null]
    );

    return result.rows[0];
  }

  /**
   * Find messages for a conversation with sender details and reply info
   * Supports cursor-based pagination (load older messages)
   */
  async findByConversationId(
    conversationId: number,
    limit: number = MESSAGES_PER_PAGE,
    beforeMessageId?: number
  ): Promise<{ messages: MessageWithSender[]; hasMore: boolean }> {
    let sql = `
      SELECT
        m.*,
        u.name as sender_name,
        rm.id as reply_to_id,
        rm.content as reply_to_content,
        rm.sender_id as reply_to_sender_id,
        ru.name as reply_to_sender_name
      FROM ${this.tableName} m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN ${this.tableName} rm ON m.reply_to_message_id = rm.id
      LEFT JOIN users ru ON rm.sender_id = ru.id
      WHERE m.conversation_id = $1
    `;
    const params: (number | undefined)[] = [conversationId];
    let paramCount = 2;

    if (beforeMessageId) {
      sql += ` AND m.id < $${paramCount++}`;
      params.push(beforeMessageId);
    }

    // Fetch one extra to check if there are more
    sql += ` ORDER BY m.created_at DESC LIMIT $${paramCount}`;
    params.push(limit + 1);

    const result = await query(sql, params);
    const hasMore = result.rows.length > limit;
    const rawMessages = result.rows.slice(0, limit);

    // Transform to include reply_to object
    const messages: MessageWithSender[] = rawMessages.map((row) => {
      const message: MessageWithSender = {
        id: row.id,
        conversation_id: row.conversation_id,
        sender_id: row.sender_id,
        content: row.content,
        is_vanishing: row.is_vanishing,
        expires_at: row.expires_at,
        read_at: row.read_at,
        reply_to_message_id: row.reply_to_message_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sender_name: row.sender_name,
        reply_to: row.reply_to_id
          ? {
              id: row.reply_to_id,
              content: row.reply_to_content,
              sender_id: row.reply_to_sender_id,
              sender_name: row.reply_to_sender_name,
            }
          : null,
      };
      return message;
    });

    // Reverse to show oldest first in the UI
    return { messages: messages.reverse(), hasMore };
  }

  /**
   * Find a message by ID with sender details and reply info
   */
  async findByIdWithSender(messageId: number): Promise<MessageWithSender | null> {
    const result = await query(
      `SELECT
        m.*,
        u.name as sender_name,
        rm.id as reply_to_id,
        rm.content as reply_to_content,
        rm.sender_id as reply_to_sender_id,
        ru.name as reply_to_sender_name
       FROM ${this.tableName} m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN ${this.tableName} rm ON m.reply_to_message_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE m.id = $1`,
      [messageId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      is_vanishing: row.is_vanishing,
      expires_at: row.expires_at,
      read_at: row.read_at,
      reply_to_message_id: row.reply_to_message_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sender_name: row.sender_name,
      reply_to: row.reply_to_id
        ? {
            id: row.reply_to_id,
            content: row.reply_to_content,
            sender_id: row.reply_to_sender_id,
            sender_name: row.reply_to_sender_name,
          }
        : null,
    };
  }

  /**
   * Mark messages as read up to a certain point
   */
  async markAsRead(
    conversationId: number,
    userId: number,
    upToMessageId: number
  ): Promise<number> {
    const result = await query(
      `UPDATE ${this.tableName}
       SET read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1
         AND sender_id != $2
         AND id <= $3
         AND read_at IS NULL
       RETURNING id`,
      [conversationId, userId, upToMessageId]
    );

    return result.rowCount || 0;
  }

  /**
   * Delete expired vanishing messages
   * Returns the count of deleted messages
   */
  async deleteExpiredVanishingMessages(): Promise<number> {
    const result = await query(
      `DELETE FROM ${this.tableName}
       WHERE is_vanishing = TRUE
         AND expires_at IS NOT NULL
         AND expires_at < CURRENT_TIMESTAMP
       RETURNING id`
    );

    return result.rowCount || 0;
  }

  /**
   * Get the latest message in a conversation
   */
  async getLatestMessage(conversationId: number): Promise<Message | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName}
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [conversationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a specific message (for user's own messages only)
   */
  async deleteByIdAndSender(
    messageId: number,
    senderId: number
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName}
       WHERE id = $1 AND sender_id = $2`,
      [messageId, senderId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Count unread messages in a conversation for a user
   */
  async countUnread(conversationId: number, userId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM ${this.tableName}
       WHERE conversation_id = $1
         AND sender_id != $2
         AND read_at IS NULL`,
      [conversationId, userId]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  }
}
