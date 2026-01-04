/**
 * Cron job for sending daily summary reports to Microsoft Teams
 *
 * Runs daily at 8:30 PM IST (15:00 UTC) to send team summaries
 * to configured Microsoft Teams channels
 */

import * as cron from 'node-cron';
import { TeamsSummaryService } from '../services/teams-summary.service';
import { TeamsNotificationService } from '../services/teams-notification.service';
import { getCurrentDateIST } from '../utils/timezone.util';
import {
  TEAMS_SUMMARY_CRON_SCHEDULE,
  CRON_TIMEZONE,
  SKIP_EMPTY_SUMMARIES,
} from '../config/jobs.config';

export class TeamsDailySummaryJob {
  private summaryService: TeamsSummaryService;
  private notificationService: TeamsNotificationService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.summaryService = new TeamsSummaryService();
    this.notificationService = new TeamsNotificationService();
  }

  /**
   * Start the cron job
   *
   * Schedules the daily summary job to run at the configured time
   */
  start(): void {
    // Check if Teams summary is enabled
    const isEnabled = process.env.ENABLE_TEAMS_SUMMARY === 'true';

    if (!isEnabled) {
      console.log('Teams daily summary job is disabled (ENABLE_TEAMS_SUMMARY=false)');
      return;
    }

    console.log(`Starting Teams daily summary job with schedule: ${TEAMS_SUMMARY_CRON_SCHEDULE}`);

    // Create and start the cron job
    this.task = cron.schedule(
      TEAMS_SUMMARY_CRON_SCHEDULE,
      () => {
        this.execute().catch(error => {
          console.error('Teams daily summary job failed:', error);
        });
      },
      {
        timezone: CRON_TIMEZONE,
      }
    );

    console.log('Teams daily summary job started successfully');
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('Teams daily summary job stopped');
    }
  }

  /**
   * Execute the job logic
   *
   * This method can be called manually for testing without waiting for the cron schedule
   *
   * @param date - Optional date override (YYYY-MM-DD). If not provided, uses current IST date
   * @param globalWebhookUrl - Optional global webhook URL override
   */
  async execute(date?: string, globalWebhookUrl?: string): Promise<void> {
    const startTime = Date.now();
    console.log('='.repeat(60));
    console.log('Teams Daily Summary Job - Starting');
    console.log('='.repeat(60));

    try {
      // Determine the date to generate summary for
      const summaryDate = date || getCurrentDateIST();
      console.log(`Generating summaries for date: ${summaryDate}`);

      // Get global webhook URL from environment or parameter
      const globalWebhook = globalWebhookUrl || process.env.TEAMS_WEBHOOK_URL;

      // Generate summaries for all teams
      const summaries = await this.summaryService.generateAllTeamsSummaries(summaryDate);

      console.log(`Generated ${summaries.length} team summaries with activity`);

      if (summaries.length === 0) {
        console.log('No teams with activity found. Nothing to send.');
        return;
      }

      // Send notifications for each team
      let successCount = 0;
      let failureCount = 0;

      for (const summary of summaries) {
        try {
          // Skip teams with no activity if configured
          if (SKIP_EMPTY_SUMMARIES && summary.userSummaries.length === 0) {
            console.log(`Skipping team ${summary.teamName} - no activity`);
            continue;
          }

          // Determine webhook URL: team-specific or global fallback
          const webhookUrl = await this.getWebhookUrl(summary.teamId, globalWebhook);

          if (!webhookUrl) {
            console.warn(`No webhook URL configured for team: ${summary.teamName} (ID: ${summary.teamId})`);
            failureCount++;
            continue;
          }

          // Send notification
          console.log(`Sending notification for team: ${summary.teamName}`);
          const result = await this.notificationService.sendDailySummary(summary, webhookUrl);

          if (result.success) {
            successCount++;
            console.log(`✓ Successfully sent notification for team: ${summary.teamName}`);
          } else {
            failureCount++;
            console.error(`✗ Failed to send notification for team: ${summary.teamName}`, result.error);
          }
        } catch (error) {
          failureCount++;
          console.error(`Error processing team ${summary.teamName}:`, error);
        }
      }

      // Log summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('='.repeat(60));
      console.log('Teams Daily Summary Job - Completed');
      console.log(`Duration: ${duration}s`);
      console.log(`Success: ${successCount}, Failed: ${failureCount}, Total: ${summaries.length}`);
      console.log('='.repeat(60));
    } catch (error) {
      console.error('Teams daily summary job encountered an error:', error);
      throw error;
    }
  }

  /**
   * Get the webhook URL for a team
   *
   * Priority: team-specific webhook > global webhook
   *
   * @param teamId - Team ID
   * @param globalWebhook - Global webhook URL fallback
   * @returns Webhook URL or null if none configured
   */
  private async getWebhookUrl(teamId: number, globalWebhook?: string): Promise<string | null> {
    // For now, we'll use the global webhook as teams don't have webhook_url in DB yet
    // Once the migration is run, we can fetch team-specific webhooks from the database

    // In future enhancement, uncomment this to use team-specific webhooks:
    // const team = await new TeamsRepository().findById(teamId);
    // if (team?.webhook_url) {
    //   return team.webhook_url;
    // }

    // Fallback to global webhook
    return globalWebhook || null;
  }
}
