/**
 * Monthly Recap Service
 *
 * Generates and caches AI-powered monthly recap slides for users.
 * Aggregates log data into slide-ready stats, calls AI for narrative content,
 * and stores results in the database for instant retrieval.
 */

import { generateText } from 'ai';
import { MonthlyRecapRepository } from '../db/repositories/monthly-recap.repository';
import { LogsRepository } from '../db/repositories/logs.repository';
import { UsersRepository } from '../db/repositories/users.repository';
import { ProjectsRepository } from '../db/repositories/projects.repository';
import {
  getDefaultModel,
  buildMonthlyRecapPrompt,
  type MonthlyRecapContext,
} from '../lib/ai';
import {
  calculateTotalHours,
  aggregateByProject,
  findBusiestDay,
  computeStreaks,
  findMostProductiveDayOfWeek,
  rankUserInTeam,
  parseTimeToHours,
} from '../utils/recap-analytics';
import type { MonthlyRecap, RecapSlide } from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export class MonthlyRecapService {
  private recapRepository: MonthlyRecapRepository;
  private logsRepository: LogsRepository;
  private usersRepository: UsersRepository;
  private projectsRepository: ProjectsRepository;

  constructor() {
    this.recapRepository = new MonthlyRecapRepository();
    this.logsRepository = new LogsRepository();
    this.usersRepository = new UsersRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  /**
   * Get an existing recap or generate a new one.
   * Cached recaps are returned instantly.
   */
  async getOrGenerateRecap(userId: number, month: number, year: number): Promise<MonthlyRecap> {
    this.validateMonthYear(month, year);

    // Check cache
    const existing = await this.recapRepository.findByUserAndMonth(userId, month, year);
    if (existing) {
      return existing;
    }

    // Generate new recap
    const isPartial = this.isCurrentMonth(month, year);
    const slides = await this.generateRecap(userId, month, year);

    return this.recapRepository.upsert(userId, month, year, slides, isPartial);
  }

  /**
   * Update the last viewed slide index for resume-on-reopen.
   */
  async updateLastViewed(recapId: number, slideIndex: number): Promise<void> {
    await this.recapRepository.updateLastViewedSlide(recapId, slideIndex);
  }

  /**
   * Get months that have log data for a user.
   */
  async getAvailableMonths(userId: number): Promise<Array<{ month: number; year: number; generated: boolean }>> {
    // Find all months with logs
    const logs = await this.logsRepository.findByUserId(userId);
    const monthSet = new Map<string, { month: number; year: number }>();

    for (const log of logs) {
      const date = new Date(log.date);
      const m = date.getUTCMonth() + 1;
      const y = date.getUTCFullYear();
      const key = `${y}-${m}`;
      if (!monthSet.has(key)) {
        monthSet.set(key, { month: m, year: y });
      }
    }

    // Check which have already been generated
    const generatedRecaps = await this.recapRepository.findAvailableRecaps(userId);
    const generatedSet = new Set(generatedRecaps.map(r => `${r.year}-${r.month}`));

    return [...monthSet.values()]
      .map(m => ({ ...m, generated: generatedSet.has(`${m.year}-${m.month}`) }))
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }

  /**
   * Generate recap for all active users (called by cron job).
   */
  async generateRecapsForAllUsers(): Promise<{ success: number; failed: number }> {
    const now = new Date();
    // Generate for previous month
    const targetMonth = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();
    const targetYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();

    const users = await this.usersRepository.findAll();
    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await this.getOrGenerateRecap(user.id, targetMonth, targetYear);
        success++;
        logger.info(`Generated monthly recap for user ${user.name} (${targetMonth}/${targetYear})`);
      } catch (error) {
        failed++;
        logger.error(`Failed to generate recap for user ${user.id}`, { error });
      }
    }

    return { success, failed };
  }

  /**
   * Core recap generation logic.
   * Computes all data-driven slides and calls AI for narrative content.
   */
  private async generateRecap(userId: number, month: number, year: number): Promise<RecapSlide[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // Date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Fetch logs with project names
    const logs = await this.logsRepository.findByUserId(userId, undefined, startDate, endDate);
    if (logs.length === 0) {
      throw new NotFoundError('No log data available for this month');
    }

    // Resolve project names
    const projectIds = [...new Set(logs.map(l => l.project_id))];
    const projectMap = new Map<number, string>();
    for (const pid of projectIds) {
      const project = await this.projectsRepository.findById(pid);
      if (project) projectMap.set(pid, project.name);
    }

    const logsWithProjects = logs.map(l => ({
      ...l,
      project_name: projectMap.get(l.project_id) ?? 'Unknown',
    }));

    // Compute stats
    const totalHours = Math.round(calculateTotalHours(logsWithProjects) * 100) / 100;
    const uniqueDates = [...new Set(logs.map(l => l.date))];
    const totalDaysLogged = uniqueDates.length;
    const avgHoursPerDay = totalDaysLogged > 0
      ? Math.round((totalHours / totalDaysLogged) * 100) / 100
      : 0;

    const projectStats = aggregateByProject(logsWithProjects);
    const topProjects = projectStats.slice(0, 5);

    const busiestDayData = findBusiestDay(logsWithProjects);
    const busiestDayDate = new Date(busiestDayData.date);
    const busiestDayOfWeek = DAYS_OF_WEEK[busiestDayDate.getUTCDay()];

    const streaks = computeStreaks(uniqueDates);
    const mostProductiveDayOfWeek = findMostProductiveDayOfWeek(logsWithProjects);

    // Previous month comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;
    const prevLogs = await this.logsRepository.findByUserId(userId, undefined, prevStartDate, prevEndDate);
    const prevTotalHours = calculateTotalHours(prevLogs);
    const comparisonToPrevMonth = prevTotalHours > 0
      ? Math.round(((totalHours - prevTotalHours) / prevTotalHours) * 1000) / 10
      : 0;

    // Team standing
    let teamStanding = { rank: 0, totalMembers: 1, userHours: totalHours, teamAvgHours: totalHours, percentile: 0 };
    if (user.team_id) {
      const teamMembers = await this.usersRepository.findByTeamId(user.team_id);
      const memberHours: number[] = [];
      for (const member of teamMembers) {
        const memberLogs = await this.logsRepository.findByUserId(member.id, undefined, startDate, endDate);
        memberHours.push(calculateTotalHours(memberLogs));
      }
      const ranking = rankUserInTeam(totalHours, memberHours);
      const teamTotal = memberHours.reduce((a, b) => a + b, 0);
      teamStanding = {
        rank: ranking.rank,
        totalMembers: teamMembers.length,
        userHours: totalHours,
        teamAvgHours: teamMembers.length > 0 ? Math.round((teamTotal / teamMembers.length) * 100) / 100 : 0,
        percentile: ranking.percentile,
      };
    }

    // AI-generated content
    const monthName = MONTH_NAMES[month - 1];
    let aiContent = {
      insight: `${monthName} was a productive month for you! You logged ${totalHours} hours across ${projectStats.length} projects.`,
      highlights: [
        `Logged ${totalDaysLogged} days this month`,
        `${topProjects[0]?.name ?? 'Your top project'} was your focus`,
        `${streaks.longest}-day logging streak`,
      ],
      funFact: `With ${totalHours} hours logged, you could have watched about ${Math.round(totalHours / 2)} movies!`,
      emoji: '🚀',
    };

    try {
      const recapContext: MonthlyRecapContext = {
        userName: user.name,
        monthName,
        year,
        totalHours,
        totalDaysLogged,
        avgHoursPerDay,
        topProjects: topProjects.map(p => ({ name: p.name, hours: p.hours, percentage: p.percentage })),
        busiestDay: {
          date: busiestDayData.date,
          dayOfWeek: busiestDayOfWeek,
          hours: Math.round(busiestDayData.totalHours * 100) / 100,
        },
        longestStreak: streaks.longest,
        mostProductiveDayOfWeek,
        teamRank: user.team_id ? {
          rank: teamStanding.rank,
          totalMembers: teamStanding.totalMembers,
          percentile: teamStanding.percentile,
        } : undefined,
      };

      const prompt = buildMonthlyRecapPrompt(recapContext);
      const model = getDefaultModel('fast');
      const result = await generateText({ model, prompt });
      const parsed = JSON.parse(result.text);

      aiContent = {
        insight: parsed.insight || aiContent.insight,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : aiContent.highlights,
        funFact: parsed.funFact || aiContent.funFact,
        emoji: parsed.emoji || aiContent.emoji,
      };
    } catch (error) {
      logger.warn('AI generation failed for monthly recap, using fallback', { error, userId, month, year });
    }

    // Assemble slides
    const slides: RecapSlide[] = [
      {
        type: 'welcome',
        userName: user.name,
        monthName,
        year,
        totalLogs: logs.length,
      },
      {
        type: 'total-hours',
        totalHours,
        avgHoursPerDay,
        totalDaysLogged,
        comparisonToPrevMonth,
      },
      {
        type: 'top-projects',
        projects: topProjects.map(p => ({ name: p.name, hours: p.hours, percentage: p.percentage })),
      },
      {
        type: 'busiest-day',
        date: busiestDayData.date,
        dayOfWeek: busiestDayOfWeek,
        hours: Math.round(busiestDayData.totalHours * 100) / 100,
        tasks: busiestDayData.taskCount,
        topProject: busiestDayData.topProject,
      },
      {
        type: 'streaks-patterns',
        longestStreak: streaks.longest,
        currentStreak: streaks.current,
        mostProductiveDayOfWeek,
      },
      {
        type: 'ai-insight',
        insight: aiContent.insight,
        highlights: aiContent.highlights,
        emoji: aiContent.emoji,
      },
      {
        type: 'team-standing',
        ...teamStanding,
      },
      {
        type: 'summary',
        totalHours,
        topProject: topProjects[0]?.name ?? 'N/A',
        daysLogged: totalDaysLogged,
        funFact: aiContent.funFact,
      },
    ];

    return slides;
  }

  private validateMonthYear(month: number, year: number): void {
    if (month < 1 || month > 12) throw new BadRequestError('Month must be between 1 and 12');
    if (year < 2020) throw new BadRequestError('Year must be 2020 or later');

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      throw new BadRequestError('Cannot generate recap for a future month');
    }
  }

  private isCurrentMonth(month: number, year: number): boolean {
    const now = new Date();
    return now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month;
  }
}
