/**
 * Service for sending notifications to Microsoft Teams via webhooks
 *
 * This service handles the communication with Microsoft Teams channels
 * using incoming webhook connectors and includes retry logic for reliability
 */

import axios, { AxiosError } from 'axios';
import { TeamsSummaryData, AdaptiveCardPayload, TeamsNotificationResult } from '../types/teams.types';
import { formatTeamsSummaryCard } from '../utils/teams-card-formatter.util';
import {
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_MAX_RETRIES,
  WEBHOOK_RETRY_DELAY_MS,
} from '../config/jobs.config';

export class TeamsNotificationService {
  /**
   * Send a daily summary to Microsoft Teams channel
   *
   * @param summary - Team summary data
   * @param webhookUrl - Microsoft Teams incoming webhook URL
   * @returns Result indicating success or failure
   */
  async sendDailySummary(
    summary: TeamsSummaryData,
    webhookUrl: string
  ): Promise<TeamsNotificationResult> {
    try {
      // Validate webhook URL
      if (!this.validateWebhookUrl(webhookUrl)) {
        return {
          success: false,
          teamId: summary.teamId,
          teamName: summary.teamName,
          error: 'Invalid webhook URL format',
        };
      }

      // Format the summary as an Adaptive Card
      const card = formatTeamsSummaryCard(summary);

      // Send with retry logic
      await this.sendWithRetry(webhookUrl, card);

      console.log(`Successfully sent Teams notification for team: ${summary.teamName}`);
      return {
        success: true,
        teamId: summary.teamId,
        teamName: summary.teamName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send Teams notification for team ${summary.teamName}:`, errorMessage);

      return {
        success: false,
        teamId: summary.teamId,
        teamName: summary.teamName,
        error: errorMessage,
      };
    }
  }

  /**
   * Send webhook request with retry logic
   *
   * @param webhookUrl - Microsoft Teams incoming webhook URL
   * @param payload - Adaptive Card payload
   * @throws Error if all retry attempts fail
   */
  private async sendWithRetry(webhookUrl: string, payload: AdaptiveCardPayload): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
      try {
        await axios.post(webhookUrl, payload, {
          timeout: WEBHOOK_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Success - no need to retry
        return;
      } catch (error) {
        lastError = error as Error;

        // Log the error
        const isAxiosError = axios.isAxiosError(error);
        const statusCode = isAxiosError ? (error as AxiosError).response?.status : 'N/A';
        const errorMessage = isAxiosError
          ? (error as AxiosError).message
          : error instanceof Error
          ? error.message
          : 'Unknown error';

        console.warn(
          `Webhook attempt ${attempt}/${WEBHOOK_MAX_RETRIES} failed:`,
          `Status: ${statusCode},`,
          `Error: ${errorMessage}`
        );

        // If this is not the last attempt, wait before retrying
        if (attempt < WEBHOOK_MAX_RETRIES) {
          await this.delay(WEBHOOK_RETRY_DELAY_MS);
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to send webhook after ${WEBHOOK_MAX_RETRIES} attempts: ${
        lastError?.message || 'Unknown error'
      }`
    );
  }

  /**
   * Validate webhook URL format
   *
   * Checks if the URL is a valid Microsoft Teams webhook URL
   *
   * @param webhookUrl - URL to validate
   * @returns true if valid, false otherwise
   */
  private validateWebhookUrl(webhookUrl: string): boolean {
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return false;
    }

    try {
      const url = new URL(webhookUrl);

      // Microsoft Teams webhook URLs should be HTTPS
      if (url.protocol !== 'https:') {
        return false;
      }

      // Check if it's a Microsoft webhook domain
      const validDomains = [
        'webhook.office.com',
        'outlook.office.com',
        'outlook.office365.com',
      ];

      const isValidDomain = validDomains.some(domain => url.hostname.includes(domain));

      if (!isValidDomain) {
        console.warn(`Webhook URL does not match expected Microsoft Teams domains: ${webhookUrl}`);
        // Still return true as Microsoft might use other domains
        // This is just a warning, not a hard validation
      }

      return true;
    } catch (error) {
      console.error('Invalid webhook URL format:', webhookUrl);
      return false;
    }
  }

  /**
   * Delay execution for a specified duration
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
