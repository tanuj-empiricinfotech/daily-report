import { Response, NextFunction } from 'express';
import { AssignmentsService } from '../services/assignments.service';
import { AuthRequest } from '../middleware/auth';
import { UnauthorizedError } from '../utils/errors';

export class AssignmentsController {
  private assignmentsService: AssignmentsService;

  constructor() {
    this.assignmentsService = new AssignmentsService();
  }

  assign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.body.project_id, 10);
      const userId = parseInt(req.body.user_id, 10);
      const assignment = await this.assignmentsService.assignUserToProject(projectId, userId);
      res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  unassign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.body.project_id, 10);
      const userId = parseInt(req.body.user_id, 10);
      await this.assignmentsService.unassignUserFromProject(projectId, userId);
      res.json({
        success: true,
        message: 'User unassigned from project successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAssignments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const currentUser = req.user;

      if (!currentUser) {
        return next(new UnauthorizedError('User not authenticated'));
      }

      // Users can only access their own assignments, admins can access any user's assignments
      if (currentUser.role !== 'admin' && currentUser.userId !== userId) {
        return next(new UnauthorizedError('You can only access your own assignments'));
      }

      const assignments = await this.assignmentsService.getUserAssignments(userId);
      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectAssignments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const assignments = await this.assignmentsService.getProjectAssignments(projectId);
      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  };
}

