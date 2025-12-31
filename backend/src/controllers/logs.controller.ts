import { Response, NextFunction } from 'express';
import { LogsService } from '../services/logs.service';
import { AuthRequest } from '../middleware/auth';
import { CreateLogDto, UpdateLogDto } from '../types';

export class LogsController {
  private logsService: LogsService;

  constructor() {
    this.logsService = new LogsService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateLogDto = req.body;
      const userId = req.user!.userId;
      const log = await this.logsService.createLog(data, userId);
      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  createBulk = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataArray: CreateLogDto[] = req.body;
      const userId = req.user!.userId;
      const logs = await this.logsService.createLogsBulk(dataArray, userId);
      res.status(201).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const date = req.query.date as string | undefined;
      const logs = await this.logsService.getUserLogs(userId, date);
      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  getTeamLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const filters = {
        date: req.query.date as string | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string, 10) : undefined,
        projectId: req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined,
      };
      const logs = await this.logsService.getTeamLogs(teamId, filters);
      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      const log = await this.logsService.getLogById(id, userId, isAdmin);
      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const data: UpdateLogDto = req.body;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      const log = await this.logsService.updateLog(id, data, userId, isAdmin);
      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      await this.logsService.deleteLog(id, userId, isAdmin);
      res.json({
        success: true,
        message: 'Log deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

