/**
 * Job initializer - Starts all scheduled jobs
 *
 * This module is responsible for initializing and starting all cron jobs
 * when the server starts
 */

import { TeamsDailySummaryJob } from './teams-daily-summary.job';

/**
 * Initialize and start all scheduled jobs
 *
 * Call this function after the server starts to begin running cron jobs
 */
export function initializeJobs(): void {
  console.log('Initializing scheduled jobs...');

  try {
    // Initialize Teams daily summary job
    const teamsSummaryJob = new TeamsDailySummaryJob();
    teamsSummaryJob.start();

    console.log('All scheduled jobs initialized successfully');
  } catch (error) {
    console.error('Failed to initialize scheduled jobs:', error);
    // Don't throw - allow server to continue running even if jobs fail to start
  }
}

/**
 * Export job classes for manual testing
 */
export { TeamsDailySummaryJob };
