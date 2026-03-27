/**
 * Monthly Recap Generation Job
 *
 * Runs on the last day of each month at 9:00 AM IST (3:30 UTC)
 * to pre-generate AI-powered monthly recaps for all active users.
 */

import * as cron from 'node-cron';
import { MonthlyRecapService } from '../services/monthly-recap.service';
import { CRON_TIMEZONE } from '../config/jobs.config';
import logger from '../utils/logger';

/**
 * Cron schedule: 9:00 AM IST on the last day of each month.
 *
 * There's no native cron syntax for "last day of month", so we run
 * at 3:30 UTC (9:00 AM IST) on the 28th-31st and check in the handler
 * whether today is actually the last day.
 */
const MONTHLY_RECAP_CRON_SCHEDULE = '30 3 28-31 * *';

function isLastDayOfMonth(): boolean {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(now.getUTCDate() + 1);
  return tomorrow.getUTCMonth() !== now.getUTCMonth();
}

export class MonthlyRecapJob {
  private recapService: MonthlyRecapService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.recapService = new MonthlyRecapService();
  }

  start(): void {
    logger.info(`Starting monthly recap job with schedule: ${MONTHLY_RECAP_CRON_SCHEDULE}`);

    this.task = cron.schedule(
      MONTHLY_RECAP_CRON_SCHEDULE,
      () => {
        if (!isLastDayOfMonth()) {
          logger.debug('Monthly recap job skipped — not the last day of the month');
          return;
        }

        this.execute().catch(error => {
          logger.error('Monthly recap job failed', { error });
        });
      },
      { timezone: CRON_TIMEZONE }
    );

    logger.info('Monthly recap job started successfully');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info('Monthly recap job stopped');
    }
  }

  /**
   * Execute the job manually (also used by the cron trigger).
   */
  async execute(): Promise<void> {
    const startTime = Date.now();
    logger.info('Monthly Recap Job — Starting');

    try {
      const result = await this.recapService.generateRecapsForAllUsers();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logger.info('Monthly Recap Job — Completed', {
        duration: `${duration}s`,
        success: result.success,
        failed: result.failed,
      });
    } catch (error) {
      logger.error('Monthly recap job encountered an error', { error });
      throw error;
    }
  }
}
