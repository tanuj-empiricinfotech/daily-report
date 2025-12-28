import { TeamsRepository } from '../db/repositories/teams.repository';
import { Team, CreateTeamDto } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class TeamsService {
  private teamsRepository: TeamsRepository;

  constructor() {
    this.teamsRepository = new TeamsRepository();
  }

  async createTeam(data: CreateTeamDto, createdBy: number): Promise<Team> {
    return await this.teamsRepository.create(data, createdBy);
  }

  async getTeamById(id: number): Promise<Team> {
    const team = await this.teamsRepository.findById(id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    return team;
  }

  async getAllTeams(): Promise<Team[]> {
    return await this.teamsRepository.findAll();
  }

  async updateTeam(id: number, data: Partial<CreateTeamDto>, userId: number): Promise<Team> {
    const team = await this.getTeamById(id);
    if (team.created_by !== userId) {
      throw new ForbiddenError('You can only update teams you created');
    }
    const updated = await this.teamsRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Team not found');
    }
    return updated;
  }

  async deleteTeam(id: number, userId: number): Promise<void> {
    const team = await this.getTeamById(id);
    if (team.created_by !== userId) {
      throw new ForbiddenError('You can only delete teams you created');
    }
    const deleted = await this.teamsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Team not found');
    }
  }
}

