import { Response, NextFunction } from 'express';
import { ProjectsService } from '../services/projects.service';
import { AuthRequest } from '../middleware/auth';
import { CreateProjectDto } from '../types';
import { query } from '../db/connection';

export class ProjectsController {
  private projectsService: ProjectsService;

  constructor() {
    this.projectsService = new ProjectsService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateProjectDto = req.body;
      const userId = req.user!.userId;
      const project = await this.projectsService.createProject(data, userId);
      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      // Get user's team_id from database
      const userResult = await query('SELECT team_id FROM users WHERE id = $1', [user.userId]);
      const userTeamId = userResult.rows[0]?.team_id || null;
      
      const projects = await this.projectsService.getAllProjects(
        user.userId,
        user.role,
        userTeamId
      );
      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  getByTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const user = req.user!;
      // Get user's team_id from database
      const userResult = await query('SELECT team_id FROM users WHERE id = $1', [user.userId]);
      const userTeamId = userResult.rows[0]?.team_id || null;
      
      const projects = await this.projectsService.getProjectsByTeamId(
        teamId,
        user.userId,
        user.role,
        userTeamId
      );
      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const projects = await this.projectsService.getProjectsByUserId(user.userId);
      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await this.projectsService.getProjectById(id);
      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const data: Partial<CreateProjectDto> = req.body;
      const userId = req.user!.userId;
      const project = await this.projectsService.updateProject(id, data, userId);
      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.userId;
      await this.projectsService.deleteProject(id, userId);
      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

