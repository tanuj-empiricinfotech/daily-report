import { Response, NextFunction } from 'express';
import { TeamsService } from '../services/teams.service';
import { AuthRequest, getAuthenticatedUser } from '../middleware/auth';
import { CreateTeamDto } from '../types';
import { TeamsDailySummaryJob } from '../jobs/teams-daily-summary.job';
import logger from '../utils/logger';

export class TeamsController {
  private teamsService: TeamsService;

  constructor() {
    this.teamsService = new TeamsService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateTeamDto = req.body;
      const userId = getAuthenticatedUser(req).userId;
      const team = await this.teamsService.createTeam(data, userId);
      res.status(201).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teams = await this.teamsService.getAllTeams();
      res.json({
        success: true,
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const team = await this.teamsService.getTeamById(id);
      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const data: Partial<CreateTeamDto> = req.body;
      const userId = getAuthenticatedUser(req).userId;
      const team = await this.teamsService.updateTeam(id, data, userId);
      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = getAuthenticatedUser(req).userId;
      await this.teamsService.deleteTeam(id, userId);
      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test endpoint to manually trigger Teams daily summary
   * Useful for testing webhook configuration and debugging
   */
  testDailySummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date, webhookUrl } = req.body;

      if (!webhookUrl) {
        res.status(400).json({
          success: false,
          message: 'webhookUrl is required in request body',
        });
        return;
      }

      logger.info('Manual Teams Summary Test - Starting', {
        date: date || 'today',
        webhookUrl,
      });

      const job = new TeamsDailySummaryJob();
      await job.execute(date, webhookUrl);

      res.json({
        success: true,
        message: 'Daily summary test completed. Check server logs for detailed output.',
      });
    } catch (error) {
      logger.error('Test daily summary failed', { error });
      next(error);
    }
  };

  /**
   * Trigger Teams daily summary workflow
   * This endpoint triggers the same workflow as the CRON job
   * Can be used to manually send daily summaries to Teams
   *
   * @param date - Optional date (YYYY-MM-DD) to generate summary for. Defaults to current IST date
   * @param webhookUrl - Optional webhook URL override. Defaults to TEAMS_WEBHOOK_URL environment variable
   */
  triggerDailySummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date, webhookUrl } = req.body;

      const user = getAuthenticatedUser(req);
      logger.info('API Triggered Teams Daily Summary - Starting', {
        date: date || 'current IST date',
        webhookUrl: webhookUrl || 'from environment (TEAMS_WEBHOOK_URL)',
        triggeredBy: user.email,
      });

      const job = new TeamsDailySummaryJob();
      await job.execute(date, webhookUrl);

      res.json({
        success: true,
        message: 'Daily summary workflow triggered successfully. Check server logs for detailed output.',
        data: {
          date: date || 'current IST date',
          webhookSource: webhookUrl ? 'request body' : 'environment variable',
        },
      });
    } catch (error) {
      logger.error('Trigger daily summary failed', { error });
      next(error);
    }
  };
}

