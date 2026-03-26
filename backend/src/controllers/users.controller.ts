import bcrypt from 'bcryptjs';
import { Response, NextFunction } from 'express';
import { UsersRepository } from '../db/repositories/users.repository';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto } from '../types';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';

export class UsersController {
  private usersRepository: UsersRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
  }

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const users = await this.usersRepository.findAll({ includeInactive });
      const usersWithoutPassword = users.map((user) => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json({
        success: true,
        data: usersWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  getByTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const includeInactive = req.query.includeInactive === 'true';
      const users = await this.usersRepository.findByTeamId(teamId, { includeInactive });
      const usersWithoutPassword = users.map((user) => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json({
        success: true,
        data: usersWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  getByTeamWithProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const includeInactive = req.query.includeInactive === 'true';

      // If user is a member, ensure they can only access their own team
      if (req.user && req.user.role !== 'admin') {
        const currentUser = await this.usersRepository.findById(req.user.userId);
        if (!currentUser || currentUser.team_id !== teamId) {
          throw new UnauthorizedError('You can only access your own team');
        }
      }

      const users = await this.usersRepository.findAllWithProjectsByTeamId(teamId, { includeInactive });
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateUserDto = req.body;

      const existingUser = await this.usersRepository.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await this.usersRepository.create(data, passwordHash);

      const { password_hash, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const data: Partial<CreateUserDto> = req.body;

      const existingUser = await this.usersRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.usersRepository.findByEmail(data.email);
        if (emailExists) {
          throw new BadRequestError('User with this email already exists');
        }
      }

      const updateData: Partial<CreateUserDto & { password_hash?: string }> = { ...data };
      if (data.password) {
        updateData.password_hash = await bcrypt.hash(data.password, 10);
        delete updateData.password;
      }

      const user = await this.usersRepository.update(id, updateData);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      // Prevent self-deactivation
      if (req.user && req.user.userId === id) {
        throw new BadRequestError('You cannot deactivate your own account');
      }

      const existingUser = await this.usersRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      const updatedUser = await this.usersRepository.update(id, { is_active: !existingUser.is_active });
      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      const { password_hash, ...userWithoutPassword } = updatedUser;
      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      const user = await this.usersRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.usersRepository.delete(id);
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
