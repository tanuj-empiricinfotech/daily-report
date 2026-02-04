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
    console.log(
      `Starting vanishing messages cleanup job with schedule: ${VANISHING_CLEANUP_CRON_SCHEDULE}`
    );

    this.task = cron.schedule(
      VANISHING_CLEANUP_CRON_SCHEDULE,
      () => {
        this.execute().catch((error) => {
          console.error('Vanishing messages cleanup job failed:', error);
        });
      },
      {
        timezone: CRON_TIMEZONE,
      }
    );

    console.log('Vanishing messages cleanup job started successfully');
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Vanishing messages cleanup job stopped');
    }
  }

  /**
   * Execute the cleanup task
   * Deletes all messages where expires_at < NOW()
   */
  async execute(): Promise<void> {
    console.log('Running vanishing messages cleanup...');

    try {
      const deletedCount = await this.messagesService.cleanupExpiredMessages();

      if (deletedCount > 0) {
        console.log(`Vanishing messages cleanup: deleted ${deletedCount} expired messages`);
      } else {
        console.log('Vanishing messages cleanup: no expired messages to delete');
      }
    } catch (error) {
      console.error('Error during vanishing messages cleanup:', error);
      throw error;
    }
  }

  /**
   * Manually trigger the cleanup (for testing or admin use)
   */
  async runNow(): Promise<number> {
    console.log('Manually triggering vanishing messages cleanup...');
    const deletedCount = await this.messagesService.cleanupExpiredMessages();
    console.log(`Manual cleanup completed: deleted ${deletedCount} messages`);
    return deletedCount;
  }
}
