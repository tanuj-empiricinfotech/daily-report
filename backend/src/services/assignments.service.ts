import { AssignmentsRepository } from '../db/repositories/assignments.repository';
import { ProjectsRepository } from '../db/repositories/projects.repository';
import { ProjectAssignment } from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class AssignmentsService {
  private assignmentsRepository: AssignmentsRepository;
  private projectsRepository: ProjectsRepository;

  constructor() {
    this.assignmentsRepository = new AssignmentsRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  async assignUserToProject(projectId: number, userId: number): Promise<ProjectAssignment> {
    const project = await this.projectsRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const assignment = await this.assignmentsRepository.create(projectId, userId);
    if (!assignment) {
      throw new BadRequestError('User is already assigned to this project');
    }
    return assignment;
  }

  async unassignUserFromProject(projectId: number, userId: number): Promise<void> {
    const deleted = await this.assignmentsRepository.delete(projectId, userId);
    if (!deleted) {
      throw new NotFoundError('Assignment not found');
    }
  }

  async getUserAssignments(userId: number): Promise<ProjectAssignment[]> {
    return await this.assignmentsRepository.findByUserId(userId);
  }

  async getProjectAssignments(projectId: number): Promise<ProjectAssignment[]> {
    return await this.assignmentsRepository.findByProjectId(projectId);
  }

  async isUserAssignedToProject(userId: number, projectId: number): Promise<boolean> {
    return await this.assignmentsRepository.isUserAssignedToProject(userId, projectId);
  }
}

