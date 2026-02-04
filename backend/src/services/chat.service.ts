/**
 * Chat Service
 *
 * Handles business logic for AI-powered chat about daily logs.
 * Builds context from user's logs and manages AI interactions.
 */

import { streamText, type ModelMessage } from 'ai';
import { LogsRepository } from '../db/repositories/logs.repository';
import { UsersRepository } from '../db/repositories/users.repository';
import { ProjectsRepository } from '../db/repositories/projects.repository';
import {
  getDefaultModel,
  buildSystemPrompt,
  buildMinimalSystemPrompt,
  type LogContext,
  type ChatMessage,
  type StreamingChatOptions,
} from '../lib/ai';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

export class ChatService {
  private logsRepository: LogsRepository;
  private usersRepository: UsersRepository;
  private projectsRepository: ProjectsRepository;

  constructor() {
    this.logsRepository = new LogsRepository();
    this.usersRepository = new UsersRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  /**
   * Validate and resolve the target user for chat context
   * Admins can chat about any team member's logs
   *
   * @param authenticatedUserId - The authenticated user's ID
   * @param isAdmin - Whether the authenticated user is an admin
   * @param targetUserId - Optional target user ID for admin viewing
   * @returns The resolved user ID and name
   */
  private async resolveTargetUser(
    authenticatedUserId: number,
    isAdmin: boolean,
    targetUserId?: number
  ): Promise<{ userId: number; userName: string }> {
    // If no target specified or user is chatting about themselves
    if (!targetUserId || targetUserId === authenticatedUserId) {
      const user = await this.usersRepository.findById(authenticatedUserId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return { userId: user.id, userName: user.name };
    }

    // Only admins can view other users' logs
    if (!isAdmin) {
      throw new ForbiddenError('Only admins can chat about other users\' logs');
    }

    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError(`User with ID ${targetUserId} not found`);
    }

    return { userId: targetUser.id, userName: targetUser.name };
  }

  /**
   * Build logs context for the AI from user's daily logs
   *
   * @param userId - User ID to fetch logs for
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Array of formatted log context entries
   */
  private async buildLogsContext(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<LogContext[]> {
    const logs = await this.logsRepository.findByUserId(
      userId,
      undefined, // single date
      startDate,
      endDate
    );

    // Get project names for each log
    const projectIds = [...new Set(logs.map(log => log.project_id))];
    const projectMap = new Map<number, string>();

    for (const projectId of projectIds) {
      const project = await this.projectsRepository.findById(projectId);
      if (project) {
        projectMap.set(projectId, project.name);
      }
    }

    return logs.map(log => ({
      id: log.id,
      date: log.date,
      projectName: projectMap.get(log.project_id) || 'Unknown Project',
      taskDescription: log.task_description,
      actualTimeSpent: log.actual_time_spent,
      trackedTime: log.tracked_time,
    }));
  }

  /**
   * Create a streaming chat response
   *
   * @param messages - Chat message history
   * @param authenticatedUserId - The authenticated user's ID
   * @param isAdmin - Whether the user is an admin
   * @param contextOptions - Options for building context (date range, target user)
   * @param streamOptions - Streaming configuration options
   * @returns Streaming text response
   */
  async streamChat(
    messages: ChatMessage[],
    authenticatedUserId: number,
    isAdmin: boolean,
    contextOptions?: {
      startDate?: string;
      endDate?: string;
      targetUserId?: number;
    },
    streamOptions?: StreamingChatOptions
  ) {
    // Resolve the user whose logs we're chatting about
    const { userId, userName } = await this.resolveTargetUser(
      authenticatedUserId,
      isAdmin,
      contextOptions?.targetUserId
    );

    // Build logs context
    const logsContext = await this.buildLogsContext(
      userId,
      contextOptions?.startDate,
      contextOptions?.endDate
    );

    // Build the system prompt
    const systemPrompt = logsContext.length > 0
      ? buildSystemPrompt({
          userId,
          userName,
          logs: logsContext,
          dateRange: contextOptions?.startDate && contextOptions?.endDate
            ? { startDate: contextOptions.startDate, endDate: contextOptions.endDate }
            : undefined,
        })
      : buildMinimalSystemPrompt(userName);

    // Convert messages to ModelMessage format
    const modelMessages: ModelMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })) as ModelMessage[];

    // Get the AI model
    const model = getDefaultModel('standard');

    // Stream the response
    return streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
    });
  }

  /**
   * Get chat context metadata (for UI display)
   *
   * @param authenticatedUserId - The authenticated user's ID
   * @param isAdmin - Whether the user is an admin
   * @param targetUserId - Optional target user ID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Context metadata including log count and user info
   */
  async getChatContextMetadata(
    authenticatedUserId: number,
    isAdmin: boolean,
    targetUserId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    userId: number;
    userName: string;
    logCount: number;
    dateRange: { startDate?: string; endDate?: string };
  }> {
    const { userId, userName } = await this.resolveTargetUser(
      authenticatedUserId,
      isAdmin,
      targetUserId
    );

    const logsContext = await this.buildLogsContext(userId, startDate, endDate);

    return {
      userId,
      userName,
      logCount: logsContext.length,
      dateRange: { startDate, endDate },
    };
  }
}
