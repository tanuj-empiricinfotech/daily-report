import { TeamsDailySummaryJob } from './teams-daily-summary.job';
import { MonthlyRecapJob } from './monthly-recap.job';
import logger from '../utils/logger';

export function initializeJobs(): void {
  logger.info('Initializing scheduled jobs...');

  try {
    const teamsSummaryJob = new TeamsDailySummaryJob();
    teamsSummaryJob.start();

    const monthlyRecapJob = new MonthlyRecapJob();
    monthlyRecapJob.start();

    logger.info('All scheduled jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs', { error });
  }
}

export { TeamsDailySummaryJob, MonthlyRecapJob };
