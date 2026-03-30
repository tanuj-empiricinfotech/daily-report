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
import type { MonthlyRecap, RecapSlide, DailyLog, User } from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const MAX_TOP_PROJECTS = 5;

/** Round a number to two decimal places. */
function roundToTwoDecimals(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Stats computed from logs, used to build slides and AI content. */
interface SlideStats {
  totalHours: number;
  totalDaysLogged: number;
  avgHoursPerDay: number;
  topProjects: Array<{ name: string; hours: number; percentage: number }>;
  allProjectStats: Array<{ name: string; hours: number; percentage: number }>;
  busiestDay: { date: string; dayOfWeek: string; hours: number; taskCount: number; topProject: string };
  streaks: { longest: number; current: number };
  mostProductiveDayOfWeek: string;
  comparisonToPrevMonth: number;
  teamStanding: { rank: number; totalMembers: number; userHours: number; teamAvgHours: number; percentile: number };
  monthName: string;
  year: number;
  totalLogs: number;
}

/** AI-generated narrative content with fallback values. */
interface AIContent {
  insight: string;
  highlights: string[];
  funFact: string;
  emoji: string;
}

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
   * Core recap generation orchestrator.
   * Delegates to focused helper methods for fetching, computing, AI, and assembly.
   */
  private async generateRecap(userId: number, month: number, year: number): Promise<RecapSlide[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const { startDate, endDate } = this.buildDateRange(month, year);

    const logsWithProjects = await this.fetchLogsWithProjects(userId, startDate, endDate);
    const stats = await this.computeSlideStats(logsWithProjects, user, month, year, startDate, endDate);
    const aiContent = await this.generateAIContent(user, stats);

    return this.assembleSlides(user, stats, aiContent);
  }

  /**
   * Fetch logs for the date range and resolve project names in a single batch query.
   */
  private async fetchLogsWithProjects(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<Array<DailyLog & { project_name: string }>> {
    const logs = await this.logsRepository.findByUserId(userId, undefined, startDate, endDate);
    if (logs.length === 0) {
      throw new NotFoundError('No log data available for this month');
    }

    const projectIds = [...new Set(logs.map(l => l.project_id))];
    const projects = await this.projectsRepository.findByIds(projectIds);
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    return logs.map(l => ({
      ...l,
      project_name: projectMap.get(l.project_id) ?? 'Unknown',
    }));
  }

  /**
   * Compute all data-driven statistics from logs.
   * Includes hours, projects, streaks, busiest day, team standing, and previous month comparison.
   */
  private async computeSlideStats(
    logsWithProjects: Array<DailyLog & { project_name: string }>,
    user: User,
    month: number,
    year: number,
    startDate: string,
    endDate: string,
  ): Promise<SlideStats> {
    const totalHours = roundToTwoDecimals(calculateTotalHours(logsWithProjects));
    const uniqueDates = [...new Set(logsWithProjects.map(l => l.date))];
    const totalDaysLogged = uniqueDates.length;
    const avgHoursPerDay = totalDaysLogged > 0
      ? roundToTwoDecimals(totalHours / totalDaysLogged)
      : 0;

    const allProjectStats = aggregateByProject(logsWithProjects);
    const topProjects = allProjectStats.slice(0, MAX_TOP_PROJECTS);

    const busiestDayData = findBusiestDay(logsWithProjects);
    const busiestDayDate = new Date(busiestDayData.date);
    const busiestDayOfWeek = DAYS_OF_WEEK[busiestDayDate.getUTCDay()];

    const streaks = computeStreaks(uniqueDates);
    const mostProductiveDayOfWeek = findMostProductiveDayOfWeek(logsWithProjects);

    const comparisonToPrevMonth = await this.computePrevMonthComparison(user.id, totalHours, month, year);
    const teamStanding = await this.computeTeamStanding(user, totalHours, startDate, endDate);

    const monthName = MONTH_NAMES[month - 1];

    return {
      totalHours,
      year,
      totalDaysLogged,
      avgHoursPerDay,
      topProjects: topProjects.map(p => ({ name: p.name, hours: p.hours, percentage: p.percentage })),
      allProjectStats: allProjectStats.map(p => ({ name: p.name, hours: p.hours, percentage: p.percentage })),
      busiestDay: {
        date: busiestDayData.date,
        dayOfWeek: busiestDayOfWeek,
        hours: roundToTwoDecimals(busiestDayData.totalHours),
        taskCount: busiestDayData.taskCount,
        topProject: busiestDayData.topProject,
      },
      streaks,
      mostProductiveDayOfWeek,
      comparisonToPrevMonth,
      teamStanding,
      monthName,
      totalLogs: logsWithProjects.length,
    };
  }

  /**
   * Call AI for narrative content (insight, highlights, fun fact, emoji).
   * Falls back to generated defaults if AI fails.
   */
  private async generateAIContent(user: User, stats: SlideStats): Promise<AIContent> {
    const fallback: AIContent = {
      insight: `${stats.monthName} was a productive month for you! You logged ${stats.totalHours} hours across ${stats.allProjectStats.length} projects.`,
      highlights: [
        `Logged ${stats.totalDaysLogged} days this month`,
        `${stats.topProjects[0]?.name ?? 'Your top project'} was your focus`,
        `${stats.streaks.longest}-day logging streak`,
      ],
      funFact: `With ${stats.totalHours} hours logged, you could have watched about ${Math.round(stats.totalHours / 2)} movies!`,
      emoji: '🚀',
    };

    try {
      const recapContext: MonthlyRecapContext = {
        userName: user.name,
        monthName: stats.monthName,
        year: stats.year,
        totalHours: stats.totalHours,
        totalDaysLogged: stats.totalDaysLogged,
        avgHoursPerDay: stats.avgHoursPerDay,
        topProjects: stats.topProjects,
        busiestDay: {
          date: stats.busiestDay.date,
          dayOfWeek: stats.busiestDay.dayOfWeek,
          hours: stats.busiestDay.hours,
        },
        longestStreak: stats.streaks.longest,
        mostProductiveDayOfWeek: stats.mostProductiveDayOfWeek,
        teamRank: user.team_id ? {
          rank: stats.teamStanding.rank,
          totalMembers: stats.teamStanding.totalMembers,
          percentile: stats.teamStanding.percentile,
        } : undefined,
      };

      const prompt = buildMonthlyRecapPrompt(recapContext);
      const model = getDefaultModel('fast');
      const result = await generateText({ model, prompt });
      const parsed = JSON.parse(result.text);

      return {
        insight: parsed.insight || fallback.insight,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : fallback.highlights,
        funFact: parsed.funFact || fallback.funFact,
        emoji: parsed.emoji || fallback.emoji,
      };
    } catch (error) {
      logger.warn('AI generation failed for monthly recap, using fallback', { error, userId: user.id });
      return fallback;
    }
  }

  /**
   * Assemble the final 8-slide array from stats and AI content.
   */
  private assembleSlides(user: User, stats: SlideStats, aiContent: AIContent): RecapSlide[] {
    return [
      {
        type: 'welcome',
        userName: user.name,
        monthName: stats.monthName,
        year: stats.year,
        totalLogs: stats.totalLogs,
      },
      {
        type: 'total-hours',
        totalHours: stats.totalHours,
        avgHoursPerDay: stats.avgHoursPerDay,
        totalDaysLogged: stats.totalDaysLogged,
        comparisonToPrevMonth: stats.comparisonToPrevMonth,
      },
      {
        type: 'top-projects',
        projects: stats.topProjects,
      },
      {
        type: 'busiest-day',
        date: stats.busiestDay.date,
        dayOfWeek: stats.busiestDay.dayOfWeek,
        hours: stats.busiestDay.hours,
        tasks: stats.busiestDay.taskCount,
        topProject: stats.busiestDay.topProject,
      },
      {
        type: 'streaks-patterns',
        longestStreak: stats.streaks.longest,
        currentStreak: stats.streaks.current,
        mostProductiveDayOfWeek: stats.mostProductiveDayOfWeek,
      },
      {
        type: 'ai-insight',
        insight: aiContent.insight,
        highlights: aiContent.highlights,
        emoji: aiContent.emoji,
      },
      {
        type: 'team-standing',
        ...stats.teamStanding,
      },
      {
        type: 'summary',
        totalHours: stats.totalHours,
        topProject: stats.topProjects[0]?.name ?? 'N/A',
        daysLogged: stats.totalDaysLogged,
        funFact: aiContent.funFact,
      },
    ];
  }

  /**
   * Compute the percentage change in total hours compared to the previous month.
   */
  private async computePrevMonthComparison(
    userId: number,
    currentTotalHours: number,
    month: number,
    year: number,
  ): Promise<number> {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const { startDate, endDate } = this.buildDateRange(prevMonth, prevYear);

    const prevLogs = await this.logsRepository.findByUserId(userId, undefined, startDate, endDate);
    const prevTotalHours = calculateTotalHours(prevLogs);

    if (prevTotalHours <= 0) return 0;
    return Math.round(((currentTotalHours - prevTotalHours) / prevTotalHours) * 1000) / 10;
  }

  /**
   * Compute the user's standing within their team using a single batch query.
   */
  private async computeTeamStanding(
    user: User,
    totalHours: number,
    startDate: string,
    endDate: string,
  ): Promise<SlideStats['teamStanding']> {
    const defaultStanding = { rank: 0, totalMembers: 1, userHours: totalHours, teamAvgHours: totalHours, percentile: 0 };

    if (!user.team_id) return defaultStanding;

    const teamMembers = await this.usersRepository.findByTeamId(user.team_id);
    const teamLogs = await this.logsRepository.findByTeamId(user.team_id, { startDate, endDate });

    // Group hours by user_id
    const hoursByUser = new Map<number, number>();
    for (const member of teamMembers) {
      hoursByUser.set(member.id, 0);
    }
    for (const log of teamLogs) {
      const hours = parseTimeToHours(log.actual_time_spent || log.tracked_time);
      hoursByUser.set(log.user_id, (hoursByUser.get(log.user_id) ?? 0) + hours);
    }

    const memberHours = teamMembers.map(m => hoursByUser.get(m.id) ?? 0);
    const ranking = rankUserInTeam(totalHours, memberHours);
    const teamTotal = memberHours.reduce((a, b) => a + b, 0);

    return {
      rank: ranking.rank,
      totalMembers: teamMembers.length,
      userHours: totalHours,
      teamAvgHours: teamMembers.length > 0 ? roundToTwoDecimals(teamTotal / teamMembers.length) : 0,
      percentile: ranking.percentile,
    };
  }

  /**
   * Build start/end date strings for a given month.
   */
  private buildDateRange(month: number, year: number): { startDate: string; endDate: string } {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
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
