import { LogsRepository } from '../db/repositories/logs.repository';
import { AssignmentsRepository } from '../db/repositories/assignments.repository';
import { DailyLog, CreateLogDto, UpdateLogDto } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export class LogsService {
  private logsRepository: LogsRepository;
  private assignmentsRepository: AssignmentsRepository;

  constructor() {
    this.logsRepository = new LogsRepository();
    this.assignmentsRepository = new AssignmentsRepository();
  }

  async createLog(data: CreateLogDto, userId: number): Promise<DailyLog> {
    const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(userId, data.project_id);
    if (!isAssigned) {
      throw new ForbiddenError('You are not assigned to this project');
    }

    if (data.actual_time_spent < 0 || data.tracked_time < 0) {
      throw new BadRequestError('Time values must be positive');
    }

    return await this.logsRepository.create(data, userId);
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

  async getUserLogs(userId: number, date?: string): Promise<DailyLog[]> {
    return await this.logsRepository.findByUserId(userId, date);
  }

  async getTeamLogs(teamId: number, filters?: { date?: string; userId?: number; projectId?: number }): Promise<DailyLog[]> {
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

    if (data.project_id) {
      const isAssigned = await this.assignmentsRepository.isUserAssignedToProject(userId, data.project_id);
      if (!isAssigned) {
        throw new ForbiddenError('You are not assigned to this project');
      }
    }

    if (data.actual_time_spent !== undefined && data.actual_time_spent < 0) {
      throw new BadRequestError('Actual time spent must be positive');
    }
    if (data.tracked_time !== undefined && data.tracked_time < 0) {
      throw new BadRequestError('Tracked time must be positive');
    }

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

    const deleted = await this.logsRepository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Log not found');
    }
  }
}

