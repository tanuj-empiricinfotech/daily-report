import { ProjectsRepository } from '../db/repositories/projects.repository';
import { Project, ProjectWithProgress, CreateProjectDto, UpdateProjectDto } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { query } from '../db/connection';

export class ProjectsService {
  private projectsRepository: ProjectsRepository;

  constructor() {
    this.projectsRepository = new ProjectsRepository();
  }

  async createProject(data: CreateProjectDto, createdBy: number): Promise<Project> {
    const teamCheck = await query('SELECT id FROM teams WHERE id = $1', [data.team_id]);
    if (teamCheck.rows.length === 0) {
      throw new NotFoundError('Team not found');
    }
    return await this.projectsRepository.create(data, createdBy);
  }

  async getProjectById(id: number): Promise<Project> {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  async getAllProjects(
    userId?: number,
    userRole?: string,
    userTeamId?: number | null
  ): Promise<ProjectWithProgress[]> {
    // Admins can see all projects
    if (userRole === 'admin') {
      return await this.projectsRepository.findAllWithProgress();
    }
    // Members can only see projects in their team or assigned to them
    if (userId && userTeamId !== undefined) {
      return await this.projectsRepository.findByTeamIdOrUserIdWithProgress(userTeamId, userId);
    }
    // Fallback: if no user info provided, return all (for backward compatibility)
    return await this.projectsRepository.findAllWithProgress();
  }

  async getProjectsByTeamId(
    teamId: number,
    _userId?: number,
    userRole?: string,
    userTeamId?: number | null
  ): Promise<ProjectWithProgress[]> {
    // Admins can see all projects in any team
    if (userRole === 'admin') {
      return await this.projectsRepository.findByTeamIdWithProgress(teamId);
    }
    // Members can only see projects in their own team
    if (userTeamId !== null && userTeamId === teamId) {
      return await this.projectsRepository.findByTeamIdWithProgress(teamId);
    }
    // Members trying to access other teams' projects get empty array
    return [];
  }

  async getProjectsByUserId(userId: number): Promise<ProjectWithProgress[]> {
    return await this.projectsRepository.findByUserIdWithProgress(userId);
  }

  async updateProject(id: number, data: UpdateProjectDto, userId: number): Promise<Project> {
    const project = await this.getProjectById(id);
    if (project.created_by !== userId) {
      throw new ForbiddenError('You can only update projects you created');
    }
    const updated = await this.projectsRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Project not found');
    }
    return updated;
  }

  async deleteProject(id: number, userId: number): Promise<void> {
    const project = await this.getProjectById(id);
    if (project.created_by !== userId) {
      throw new ForbiddenError('You can only delete projects you created');
    }
    const deleted = await this.projectsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Project not found');
    }
  }
}
