/**
 * SSE Connection Service
 *
 * Manages Server-Sent Events connections for real-time chat updates.
 * Handles connection tracking, heartbeats, and event broadcasting.
 */

import { Response } from 'express';
import { ConversationsRepository } from '../db/repositories/conversations.repository';
import type { SSEEvent, SSEEventType } from '../types';
import {
  SSE_HEARTBEAT_INTERVAL_MS,
  SSE_CONNECTION_TIMEOUT_MS,
} from '../config/jobs.config';
import logger from '../utils/logger';

interface SSEConnection {
  userId: number;
  response: Response;
  lastActivity: number;
}

/**
 * Singleton SSE Connection Manager
 * Tracks active connections and broadcasts events to users
 */
class SSEConnectionManager {
  private static instance: SSEConnectionManager;
  private connections: Map<number, SSEConnection[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private conversationsRepository: ConversationsRepository;

  private constructor() {
    this.conversationsRepository = new ConversationsRepository();
    this.startHeartbeat();
  }

  static getInstance(): SSEConnectionManager {
    if (!SSEConnectionManager.instance) {
      SSEConnectionManager.instance = new SSEConnectionManager();
    }
    return SSEConnectionManager.instance;
  }

  /**
   * Add a new SSE connection for a user
   */
  addConnection(userId: number, response: Response): void {
    const connection: SSEConnection = {
      userId,
      response,
      lastActivity: Date.now(),
    };

    const userConnections = this.connections.get(userId) || [];
    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    // Setup connection close handler
    response.on('close', () => {
      this.removeConnection(userId, response);
    });

    logger.debug(`SSE: User ${userId} connected. Total connections: ${this.getTotalConnections()}`);
  }

  /**
   * Remove an SSE connection
   */
  removeConnection(userId: number, response: Response): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const filtered = userConnections.filter((conn) => conn.response !== response);

    if (filtered.length === 0) {
      this.connections.delete(userId);
    } else {
      this.connections.set(userId, filtered);
    }

    logger.debug(`SSE: User ${userId} disconnected. Total connections: ${this.getTotalConnections()}`);
  }

  /**
   * Send an event to a specific user
   */
  sendToUser<T>(userId: number, event: SSEEvent<T>): boolean {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.length === 0) {
      return false;
    }

    const eventData = this.formatSSEMessage(event);

    for (const connection of userConnections) {
      try {
        connection.response.write(eventData);
        connection.lastActivity = Date.now();
      } catch (error) {
        logger.error(`SSE: Error sending to user ${userId}`, { error });
        this.removeConnection(userId, connection.response);
      }
    }

    return true;
  }

  /**
   * Send an event to all participants in a conversation
   */
  async sendToConversation<T>(
    conversationId: number,
    event: SSEEvent<T>,
    excludeUserId?: number
  ): Promise<void> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) return;

    const participantIds = [
      conversation.participant_one_id,
      conversation.participant_two_id,
    ].filter((id) => id !== excludeUserId);

    for (const userId of participantIds) {
      this.sendToUser(userId, event);
    }
  }

  /**
   * Check if a user has active connections
   */
  isUserConnected(userId: number): boolean {
    const connections = this.connections.get(userId);
    return !!connections && connections.length > 0;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): number[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get total number of active connections
   */
  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.length;
    }
    return total;
  }

  /**
   * Format an SSE message
   */
  private formatSSEMessage<T>(event: SSEEvent<T>): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  }

  /**
   * Start the heartbeat interval to keep connections alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
      this.cleanupStaleConnections();
    }, SSE_HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Send heartbeat to all connections
   */
  private sendHeartbeats(): void {
    const heartbeatData = `:heartbeat ${Date.now()}\n\n`;

    for (const [userId, userConnections] of this.connections.entries()) {
      for (const connection of userConnections) {
        try {
          connection.response.write(heartbeatData);
        } catch (error) {
          this.removeConnection(userId, connection.response);
        }
      }
    }
  }

  /**
   * Remove connections that have been inactive too long
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const timeout = SSE_CONNECTION_TIMEOUT_MS;

    for (const [userId, userConnections] of this.connections.entries()) {
      for (const connection of userConnections) {
        if (now - connection.lastActivity > timeout) {
          try {
            connection.response.end();
          } catch {
            // Ignore errors when closing
          }
          this.removeConnection(userId, connection.response);
        }
      }
    }
  }

  /**
   * Stop the heartbeat interval (for testing/shutdown)
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance getter
export const getSSEManager = (): SSEConnectionManager => {
  return SSEConnectionManager.getInstance();
};

// Export helper functions for common operations
export const sendNewMessageEvent = async (
  conversationId: number,
  message: unknown,
  senderId: number
): Promise<void> => {
  const manager = getSSEManager();
  await manager.sendToConversation(
    conversationId,
    {
      type: 'new_message' as SSEEventType,
      data: { conversation_id: conversationId, message },
    },
    senderId // Don't send to the sender
  );
};

export const sendMessageReadEvent = async (
  conversationId: number,
  readerId: number,
  upToMessageId: number
): Promise<void> => {
  const manager = getSSEManager();
  await manager.sendToConversation(
    conversationId,
    {
      type: 'message_read' as SSEEventType,
      data: {
        conversation_id: conversationId,
        reader_id: readerId,
        read_up_to_message_id: upToMessageId,
      },
    },
    readerId // Don't send to the reader
  );
};

export const sendVanishingModeChangedEvent = async (
  conversationId: number,
  vanishingMode: boolean,
  vanishingDurationHours: number,
  changedById: number
): Promise<void> => {
  const manager = getSSEManager();
  await manager.sendToConversation(conversationId, {
    type: 'vanishing_mode_changed' as SSEEventType,
    data: {
      conversation_id: conversationId,
      vanishing_mode: vanishingMode,
      vanishing_duration_hours: vanishingDurationHours,
      changed_by_id: changedById,
    },
  });
};

export const sendTypingEvent = async (
  conversationId: number,
  userId: number,
  userName: string,
  isTyping: boolean
): Promise<void> => {
  const manager = getSSEManager();
  await manager.sendToConversation(
    conversationId,
    {
      type: 'typing' as SSEEventType,
      data: {
        conversation_id: conversationId,
        user_id: userId,
        user_name: userName,
        is_typing: isTyping,
      },
    },
    userId // Don't send to the typer
  );
};
