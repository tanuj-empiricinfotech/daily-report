/**
 * Service for generating daily summary reports for teams
 *
 * This service aggregates daily logs for all team members and creates
 * structured summary data ready for display or notification
 */

import { TeamsRepository } from '../db/repositories/teams.repository';
import { UsersRepository } from '../db/repositories/users.repository';
import { LogsRepository } from '../db/repositories/logs.repository';
import { ProjectsRepository } from '../db/repositories/projects.repository';
import {
  TeamsSummaryData,
  UserDailySummary,
  TaskSummary
} from '../types/teams.types';
import { Team, DailyLog, User, Project } from '../types';
import { parseTimeToDecimal, formatDecimalToTime } from '../utils/time.util';
import logger from '../utils/logger';

/**
 * Helper function to add time values
 * Handles both HH:MM string format and decimal number format
 *
 * @param time1 - First time value (string or number)
 * @param time2 - Second time value (string or number)
 * @returns Sum in HH:MM format
 */
function addTimeValues(time1: string | number, time2: string | number): string {
  const decimal1 = typeof time1 === 'string' ? parseTimeToDecimal(time1) : time1;
  const decimal2 = typeof time2 === 'string' ? parseTimeToDecimal(time2) : time2;
  const sum = decimal1 + decimal2;
  return formatDecimalToTime(sum);
}

export class TeamsSummaryService {
  private teamsRepository: TeamsRepository;
  private usersRepository: UsersRepository;
  private logsRepository: LogsRepository;
  private projectsRepository: ProjectsRepository;

  constructor() {
    this.teamsRepository = new TeamsRepository();
    this.usersRepository = new UsersRepository();
    this.logsRepository = new LogsRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  /**
   * Generate summaries for all teams on a specific date
   *
   * @param date - Date in YYYY-MM-DD format
   * @returns Array of team summaries
   */
  async generateAllTeamsSummaries(date: string): Promise<TeamsSummaryData[]> {
    // Get all teams
    const teams = await this.teamsRepository.findAll();

    if (teams.length === 0) {
      logger.info('No teams found');
      return [];
    }

    // Generate summary for each team
    const summaries: TeamsSummaryData[] = [];
    for (const team of teams) {
      try {
        const summary = await this.generateTeamSummary(team, date);
        // Only include teams with activity
        if (summary.userSummaries.length > 0) {
          summaries.push(summary);
        }
      } catch (error) {
        logger.error(`Failed to generate summary for team ${team.name}`, { error });
        // Continue processing other teams even if one fails
      }
    }

    return summaries;
  }

  /**
   * Generate summary for a single team on a specific date
   *
   * @param team - Team object
   * @param date - Date in YYYY-MM-DD format
   * @returns Team summary data
   */
  async generateTeamSummary(team: Team, date: string): Promise<TeamsSummaryData> {
    // Get all logs for this team on the specified date
    const logs = await this.logsRepository.findByTeamId(team.id, { date });

    // If no logs, return empty summary
    if (logs.length === 0) {
      return {
        teamId: team.id,
        teamName: team.name,
        date,
        userSummaries: [],
        totalTeamActualTime: '0:00',
        totalTeamTrackedTime: '0:00',
      };
    }

    // Get all users in this team (for getting user names)
    const teamUsers = await this.usersRepository.findByTeamId(team.id);
    const userMap = new Map<number, User>();
    teamUsers.forEach(user => userMap.set(user.id, user));

    // Get unique project IDs from logs and fetch project details
    const projectIds = [...new Set(logs.map(log => log.project_id))];
    const projects = await Promise.all(
      projectIds.map(id => this.projectsRepository.findById(id))
    );
    const projectMap = new Map<number, Project>();
    projects.forEach(project => {
      if (project) {
        projectMap.set(project.id, project);
      }
    });

    // Group logs by user
    const userLogsMap = new Map<number, DailyLog[]>();
    logs.forEach(log => {
      const userLogs = userLogsMap.get(log.user_id) || [];
      userLogs.push(log);
      userLogsMap.set(log.user_id, userLogs);
    });

    // Create user summaries
    const userSummaries: UserDailySummary[] = [];
    let totalTeamActualTime: string = '0:00';
    let totalTeamTrackedTime: string = '0:00';

    userLogsMap.forEach((userLogs, userId) => {
      const user = userMap.get(userId);
      const userName = user?.name || `Unknown User (ID: ${userId})`;

      // Create task summaries for this user
      const tasks: TaskSummary[] = userLogs.map(log => {
        const project = projectMap.get(log.project_id);
        const projectName = project?.name || `Unknown Project (ID: ${log.project_id})`;

        // Time values are now stored as strings in HH:MM format
        // Return them as-is (string format)
        return {
          projectId: log.project_id,
          projectName,
          taskDescription: log.task_description,
          actualTime: log.actual_time_spent,
          trackedTime: log.tracked_time,
        };
      });

      // Calculate user totals by adding all task times
      const totalActualTime = tasks.reduce((sum, task) => addTimeValues(sum, task.actualTime), '0:00');
      const totalTrackedTime = tasks.reduce((sum, task) => addTimeValues(sum, task.trackedTime), '0:00');

      userSummaries.push({
        userId,
        userName,
        totalActualTime,
        totalTrackedTime,
        tasks,
      });

      // Add to team totals
      totalTeamActualTime = addTimeValues(totalTeamActualTime, totalActualTime);
      totalTeamTrackedTime = addTimeValues(totalTeamTrackedTime, totalTrackedTime);
    });

    // Sort user summaries by name
    userSummaries.sort((a, b) => a.userName.localeCompare(b.userName));

    return {
      teamId: team.id,
      teamName: team.name,
      date,
      userSummaries,
      totalTeamActualTime,
      totalTeamTrackedTime,
    };
  }
}
