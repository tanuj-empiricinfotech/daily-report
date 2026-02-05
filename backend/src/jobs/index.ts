/**
 * Job initializer - Starts all scheduled jobs
 *
 * This module is responsible for initializing and starting all cron jobs
 * when the server starts
 */

import { TeamsDailySummaryJob } from './teams-daily-summary.job';
import { VanishingMessagesCleanupJob } from './vanishing-messages-cleanup.job';
import logger from '../utils/logger';

/**
 * Initialize and start all scheduled jobs
 *
 * Call this function after the server starts to begin running cron jobs
 */
export function initializeJobs(): void {
  logger.info('Initializing scheduled jobs...');

  try {
    // Initialize Teams daily summary job
    const teamsSummaryJob = new TeamsDailySummaryJob();
    teamsSummaryJob.start();

    // Initialize vanishing messages cleanup job
    const vanishingCleanupJob = new VanishingMessagesCleanupJob();
    vanishingCleanupJob.start();

    logger.info('All scheduled jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs', { error });
    // Don't throw - allow server to continue running even if jobs fail to start
  }
}

/**
 * Export job classes for manual testing
 */
export { TeamsDailySummaryJob, VanishingMessagesCleanupJob };
