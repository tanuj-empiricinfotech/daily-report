import { Response, NextFunction } from 'express';
import { TeamsService } from '../services/teams.service';
import { AuthRequest } from '../middleware/auth';
import { CreateTeamDto } from '../types';

export class TeamsController {
  private teamsService: TeamsService;

  constructor() {
    this.teamsService = new TeamsService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateTeamDto = req.body;
      const userId = req.user!.userId;
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
      const userId = req.user!.userId;
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
      const userId = req.user!.userId;
      await this.teamsService.deleteTeam(id, userId);
      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

