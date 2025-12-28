import { ProjectsRepository } from '../db/repositories/projects.repository';
import { Project, CreateProjectDto } from '../types';
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

  async getProjectsByTeamId(teamId: number): Promise<Project[]> {
    return await this.projectsRepository.findByTeamId(teamId);
  }

  async updateProject(id: number, data: Partial<CreateProjectDto>, userId: number): Promise<Project> {
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

