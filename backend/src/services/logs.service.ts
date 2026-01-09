import { LogsRepository } from '../db/repositories/logs.repository';
import { AssignmentsRepository } from '../db/repositories/assignments.repository';
import { UsersRepository } from '../db/repositories/users.repository';
import { DailyLog, CreateLogDto, UpdateLogDto } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { getCurrentDateIST, isDateInPast, isDateToday } from '../utils/date';

export class LogsService {
  private logsRepository: LogsRepository;
  private assignmentsRepository: AssignmentsRepository;
  private usersRepository: UsersRepository;

  constructor() {
    this.logsRepository = new LogsRepository();
    this.assignmentsRepository = new AssignmentsRepository();
    this.usersRepository = new UsersRepository();
  }

  /**
   * Validate date access for members (admins bypass this check)
   * Members can only create logs for current date and cannot modify/delete past logs
   *
   * @param date - Date string in YYYY-MM-DD format
   * @param isAdmin - Whether the user is an admin
   * @param operation - Operation type: 'create', 'update', or 'delete'
   * @throws ForbiddenError if member tries to access past date
   */
  private validateDateAccess(date: string, isAdmin: boolean, operation: 'create' | 'update' | 'delete'): void {
    // Admins can access any date
    if (isAdmin) {
      return;
    }

    // Members can only create logs for current date
    if (operation === 'create' && !isDateToday(date)) {
      const currentDate = getCurrentDateIST();
      throw new ForbiddenError(`Members can only create logs for the current date (${currentDate})`);
    }

    // Members cannot update or delete past logs
    if ((operation === 'update' || operation === 'delete') && isDateInPast(date)) {
      throw new ForbiddenError(`Members cannot ${operation} logs for past dates`);
    }
  }

  /**
   * Validate admin creating logs for another user
   * Only admins can create logs for other users
   *
   * @param authenticatedUserId - ID of the authenticated user
   * @param isAdmin - Whether the authenticated user is an admin
   * @param targetUserId - Optional target user ID (for admin creating logs for others)
   * @returns The user ID to use for creating the log
   * @throws ForbiddenError if non-admin tries to create logs for another user
   * @throws NotFoundError if target user doesn't exist
   */
  private async validateAdminCreatingForUser(
    authenticatedUserId: number,
    isAdmin: boolean,
    targetUserId?: number
  ): Promise<number> {
    // If no target user specified, use authenticated user
    if (!targetUserId) {
      return authenticatedUserId;
    }

    // Only admins can create logs for other users
    if (!isAdmin) {
      throw new ForbiddenError('Only admins can create logs for other users');
    }

    // If admin is creating for themselves (explicitly), allow it
    if (targetUserId === authenticatedUserId) {
      return authenticatedUserId;
    }

    // Verify target user exists
    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError(`User with ID ${targetUserId} not found`);
    }

    return targetUserId;
  }

  async createLog(
    data: CreateLogDto,
    authenticatedUserId: number,
    isAdmin: boolean = false,
    targetUserId?: number
  ): Promise<DailyLog> {
    // Validate admin creating for another user and get the effective user ID
    const effectiveUserId = await this.validateAdminCreatingForUser(authenticatedUserId, isAdmin, targetUserId);

    // Validate date access for members
    this.validateDateAccess(data.date, isAdmin, 'create');

    // Check if the effective user is assigned to the project
    const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(effectiveUserId, data.project_id);
    if (!isAssigned) {
      throw new ForbiddenError('User is not assigned to this project');
    }

    // Time validation is now handled by the validator middleware
    // No need to check for negative values as time format is HH:MM string

    return await this.logsRepository.create(data, effectiveUserId);
  }

  async createLogsBulk(
    dataArray: CreateLogDto[],
    authenticatedUserId: number,
    isAdmin: boolean = false,
    targetUserId?: number
  ): Promise<DailyLog[]> {
    if (dataArray.length === 0) {
      throw new BadRequestError('At least one log entry is required');
    }

    // Validate admin creating for another user and get the effective user ID
    const effectiveUserId = await this.validateAdminCreatingForUser(authenticatedUserId, isAdmin, targetUserId);

    // Validate date access for each log entry
    for (const data of dataArray) {
      this.validateDateAccess(data.date, isAdmin, 'create');
    }

    // Validate all entries - check if effective user is assigned to all projects
    const projectIds = new Set(dataArray.map(d => d.project_id));
    for (const projectId of projectIds) {
      const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(effectiveUserId, projectId);
      if (!isAssigned) {
        throw new ForbiddenError(`User is not assigned to project ${projectId}`);
      }
    }

    // Time validation is now handled by the validator middleware
    // No need to check for negative values as time format is HH:MM string

    return await this.logsRepository.createMany(dataArray, effectiveUserId);
  }

  async getLogById(id: number, userId: number, isAdmin: boolean): Promise<DailyLog> {
    const log = await this.logsRepository.findById(id);
    if (!log) {
      throw new NotFoundError('Log not found');
    }

    if (!isAdmin && log.user_id !== userId) {
      throw new ForbiddenError('You can only view your own logs');
    }

    return log;
  }

  async getUserLogs(userId: number, date?: string, startDate?: string, endDate?: string): Promise<DailyLog[]> {
    return await this.logsRepository.findByUserId(userId, date, startDate, endDate);
  }

  async getTeamLogs(teamId: number, filters?: { date?: string; startDate?: string; endDate?: string; userId?: number; projectId?: number }): Promise<DailyLog[]> {
    return await this.logsRepository.findByTeamId(teamId, filters);
  }

  async updateLog(id: number, data: UpdateLogDto, userId: number, isAdmin: boolean): Promise<DailyLog> {
    const log = await this.logsRepository.findById(id);
    if (!log) {
      throw new NotFoundError('Log not found');
    }

    if (!isAdmin && log.user_id !== userId) {
      throw new ForbiddenError('You can only update your own logs');
    }

    // Validate date access - check the existing log date (members cannot update past logs)
    this.validateDateAccess(log.date, isAdmin, 'update');

    // If changing the date, validate the new date as well
    if (data.date) {
      this.validateDateAccess(data.date, isAdmin, 'create');
    }

    // When checking project assignment, use the log owner's ID, not the authenticated user's ID
    // This allows admins to update logs for other users with projects assigned to those users
    const userIdToCheck = log.user_id;

    if (data.project_id) {
      const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(userIdToCheck, data.project_id);
      if (!isAssigned) {
        throw new ForbiddenError('User is not assigned to this project');
      }
    }

    // Time validation is now handled by the validator middleware
    // No need to check for negative values as time format is HH:MM string

    // Note: We still pass userId (authenticated user) to the repository for audit purposes
    const updated = await this.logsRepository.update(id, data, userId);
    if (!updated) {
      throw new NotFoundError('Log not found');
    }
    return updated;
  }

  async deleteLog(id: number, userId: number, isAdmin: boolean): Promise<void> {
    const log = await this.logsRepository.findById(id);
    if (!log) {
      throw new NotFoundError('Log not found');
    }

    if (!isAdmin && log.user_id !== userId) {
      throw new ForbiddenError('You can only delete your own logs');
    }

    // Validate date access - members cannot delete past logs
    this.validateDateAccess(log.date, isAdmin, 'delete');

    const deleted = await this.logsRepository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Log not found');
    }
  }
}

