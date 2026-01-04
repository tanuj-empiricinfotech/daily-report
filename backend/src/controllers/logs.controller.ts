import { Response, NextFunction } from 'express';
import { LogsService } from '../services/logs.service';
import { AuthRequest } from '../middleware/auth';
import { CreateLogDto, UpdateLogDto } from '../types';
import { istToIso, isoToIst } from '../utils/date';

export class LogsController {
  private logsService: LogsService;

  constructor() {
    this.logsService = new LogsService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateLogDto = req.body;
      // Convert IST date to ISO for storage
      if (data.date) {
        data.date = istToIso(data.date);
      }
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      const log = await this.logsService.createLog(data, userId, isAdmin);
      // Return ISO date (frontend will convert to IST for display)
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
      // Convert IST dates to ISO for storage
      dataArray.forEach((data) => {
        if (data.date) {
          data.date = istToIso(data.date);
        }
      });
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      const logs = await this.logsService.createLogsBulk(dataArray, userId, isAdmin);
      // Return ISO dates (frontend will convert to IST for display)
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
      // Convert IST filter dates to ISO for querying
      const date = req.query.date ? istToIso(req.query.date as string) : undefined;
      const startDate = req.query.startDate ? istToIso(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? istToIso(req.query.endDate as string) : undefined;
      const logs = await this.logsService.getUserLogs(userId, date, startDate, endDate);
      // Return ISO dates (frontend will convert to IST for display)
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
      // Convert IST filter dates to ISO for querying
      const filters = {
        date: req.query.date ? istToIso(req.query.date as string) : undefined,
        startDate: req.query.startDate ? istToIso(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? istToIso(req.query.endDate as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string, 10) : undefined,
        projectId: req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined,
      };
      const logs = await this.logsService.getTeamLogs(teamId, filters);
      // Return ISO dates (frontend will convert to IST for display)
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
      // Return ISO date (frontend will convert to IST for display)
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
      // Normalize date format (validates and extracts YYYY-MM-DD)
      if (data.date) {
        data.date = istToIso(data.date);
      }
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      const log = await this.logsService.updateLog(id, data, userId, isAdmin);
      // Date is already a string in YYYY-MM-DD format (no conversion needed)
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

