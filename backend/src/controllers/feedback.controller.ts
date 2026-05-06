import { Response, NextFunction } from 'express';
import { FeedbackService } from '../services/feedback.service';
import { AuthRequest, getAuthenticatedUser } from '../middleware/auth';
import { CreateFeedbackDto } from '../types';
import { query } from '../db/connection';

export class FeedbackController {
  private service = new FeedbackService();

  submit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const data: CreateFeedbackDto = req.body;

      // Fetch team_id from DB (JWT doesn't carry it)
      const userResult = await query('SELECT team_id FROM users WHERE id = $1', [authUser.userId]);
      const fromUserTeamId = userResult.rows[0]?.team_id ?? null;

      const feedback = await this.service.submitFeedback(
        data,
        authUser.userId,
        authUser.role,
        fromUserTeamId
      );
      res.status(201).json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  };

  getReceived = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getAuthenticatedUser(req);
      const feedback = await this.service.getReceived(userId);
      res.json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  };

  getSent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getAuthenticatedUser(req);
      const feedback = await this.service.getSent(userId);
      res.json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getAuthenticatedUser(req);
      const count = await this.service.getUnreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  };
}
