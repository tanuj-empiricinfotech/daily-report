import { Response, NextFunction } from 'express';
import { UsersRepository } from '../db/repositories/users.repository';
import { AuthRequest } from '../middleware/auth';

export class UsersController {
  private usersRepository: UsersRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
  }

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.usersRepository.findAllMembers();
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  getByTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const users = await this.usersRepository.findByTeamId(teamId);
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };
}

