import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ErrorLogsRepository } from '../db/repositories/error-logs.repository';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class ErrorLogsController {
  private repository: ErrorLogsRepository;

  constructor() {
    this.repository = new ErrorLogsRepository();
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT, MAX_LIMIT);
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const [logs, total] = await Promise.all([
        this.repository.findRecent(limit, offset),
        this.repository.count(),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: { limit, offset, total },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const log = await this.repository.findById(id);
      if (!log) {
        res.status(404).json({ success: false, message: 'Error log not found' });
        return;
      }
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  };
}
