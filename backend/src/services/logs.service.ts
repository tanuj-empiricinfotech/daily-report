import { LogsRepository } from '../db/repositories/logs.repository';
import { AssignmentsRepository } from '../db/repositories/assignments.repository';
import { DailyLog, CreateLogDto, UpdateLogDto } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { getCurrentDateIST, isDateInPast, isDateToday } from '../utils/date';

export class LogsService {
  private logsRepository: LogsRepository;
  private assignmentsRepository: AssignmentsRepository;

  constructor() {
    this.logsRepository = new LogsRepository();
    this.assignmentsRepository = new AssignmentsRepository();
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

  async createLog(data: CreateLogDto, userId: number, isAdmin: boolean = false): Promise<DailyLog> {
    // Validate date access for members
    this.validateDateAccess(data.date, isAdmin, 'create');

    const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(userId, data.project_id);
    if (!isAssigned) {
      throw new ForbiddenError('You are not assigned to this project');
    }

    // Time validation is now handled by the validator middleware
    // No need to check for negative values as time format is HH:MM string

    return await this.logsRepository.create(data, userId);
  }

  async createLogsBulk(dataArray: CreateLogDto[], userId: number, isAdmin: boolean = false): Promise<DailyLog[]> {
    if (dataArray.length === 0) {
      throw new BadRequestError('At least one log entry is required');
    }

    // Validate date access for each log entry
    for (const data of dataArray) {
      this.validateDateAccess(data.date, isAdmin, 'create');
    }

    // Validate all entries
    const projectIds = new Set(dataArray.map(d => d.project_id));
    for (const projectId of projectIds) {
      const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(userId, projectId);
      if (!isAssigned) {
        throw new ForbiddenError(`You are not assigned to project ${projectId}`);
      }
    }

    // Time validation is now handled by the validator middleware
    // No need to check for negative values as time format is HH:MM string

    return await this.logsRepository.createMany(dataArray, userId);
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

    if (data.project_id) {
      const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(userId, data.project_id);
      if (!isAssigned) {
        throw new ForbiddenError('You are not assigned to this project');
      }
    }

    // Time validation is now handled by the validator middleware
    // No need to check for negative values as time format is HH:MM string

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

