/**
 * Vanishing Messages Cleanup Job
 *
 * Cron job that runs periodically to delete expired vanishing messages.
 * Messages marked as vanishing with an expired `expires_at` timestamp
 * are permanently removed from the database.
 */

import * as cron from 'node-cron';
import { MessagesService } from '../services/messages.service';
import {
  VANISHING_CLEANUP_CRON_SCHEDULE,
  CRON_TIMEZONE,
} from '../config/jobs.config';
import logger from '../utils/logger';

export class VanishingMessagesCleanupJob {
  private messagesService: MessagesService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.messagesService = new MessagesService();
  }

  /**
   * Start the cron job
   */
  start(): void {
    logger.info(`Starting vanishing messages cleanup job with schedule: ${VANISHING_CLEANUP_CRON_SCHEDULE}`);

    this.task = cron.schedule(
      VANISHING_CLEANUP_CRON_SCHEDULE,
      () => {
        this.execute().catch((error) => {
          logger.error('Vanishing messages cleanup job failed', { error });
        });
      },
      {
        timezone: CRON_TIMEZONE,
      }
    );

    logger.info('Vanishing messages cleanup job started successfully');
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Vanishing messages cleanup job stopped');
    }
  }

  /**
   * Execute the cleanup task
   * Deletes all messages where expires_at < NOW()
   */
  async execute(): Promise<void> {
    logger.debug('Running vanishing messages cleanup...');

    try {
      const deletedCount = await this.messagesService.cleanupExpiredMessages();

      if (deletedCount > 0) {
        logger.info(`Vanishing messages cleanup: deleted ${deletedCount} expired messages`);
      } else {
        logger.debug('Vanishing messages cleanup: no expired messages to delete');
      }
    } catch (error) {
      logger.error('Error during vanishing messages cleanup', { error });
      throw error;
    }
  }

  /**
   * Manually trigger the cleanup (for testing or admin use)
   */
  async runNow(): Promise<number> {
    logger.info('Manually triggering vanishing messages cleanup...');
    const deletedCount = await this.messagesService.cleanupExpiredMessages();
    logger.info(`Manual cleanup completed: deleted ${deletedCount} messages`);
    return deletedCount;
  }
}
