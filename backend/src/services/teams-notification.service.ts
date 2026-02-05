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
import logger from '../utils/logger';

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
      logger.debug('Formatting summary for team', { teamName: summary.teamName });
      const card = formatTeamsSummaryCard(summary);

      // Send with retry logic
      await this.sendWithRetry(webhookUrl, card);

      logger.info(`Successfully sent Teams notification for team: ${summary.teamName}`);
      return {
        success: true,
        teamId: summary.teamId,
        teamName: summary.teamName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send Teams notification for team ${summary.teamName}`, { error: errorMessage });

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

    // Detect webhook type and format payload accordingly
    const isPowerAutomateWebhook = this.isPowerAutomateWebhook(webhookUrl);
    const requestPayload = isPowerAutomateWebhook
      ? this.formatForPowerAutomate(payload)
      : payload;

    logger.debug('Webhook type', { 
      type: isPowerAutomateWebhook ? 'Power Automate' : 'Teams Incoming Webhook' 
    });
    logger.debug('Request payload', { payload: requestPayload });

    for (let attempt = 1; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(webhookUrl, requestPayload, {
          timeout: WEBHOOK_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Log success details
        logger.debug('Webhook request succeeded', {
          status: response.status,
          statusText: response.statusText,
          responseData: response.data,
        });

        // Success - no need to retry
        return;
      } catch (error) {
        lastError = error as Error;

        // Log the error with detailed information
        const isAxiosError = axios.isAxiosError(error);
        const statusCode = isAxiosError ? (error as AxiosError).response?.status : 'N/A';
        const responseData = isAxiosError ? (error as AxiosError).response?.data : 'N/A';
        const errorMessage = isAxiosError
          ? (error as AxiosError).message
          : error instanceof Error
            ? error.message
            : 'Unknown error';

        logger.warn(`Webhook attempt ${attempt}/${WEBHOOK_MAX_RETRIES} failed`, {
          statusCode,
          error: errorMessage,
          responseData,
        });

        // Check for specific error types and provide helpful guidance
        if (statusCode === 403) {
          const errorData = isAxiosError && (error as AxiosError).response?.data;
          const errorBody = typeof errorData === 'object' ? errorData : {};
          const nestedError = (errorBody as any)?.error;

          if (nestedError?.code === 'BotNotInConversationRoster' ||
            (typeof nestedError === 'string' && nestedError.includes('BotNotInConversationRoster'))) {
            logger.error('BOT NOT IN CONVERSATION ROSTER ERROR DETECTED', {
              message: 'This error occurs when Power Automate uses Bot Framework and the bot is not in the conversation.',
              solutions: [
                '1. Use Teams Incoming Webhook instead (recommended): Get webhook URL from Teams channel > Connectors > Incoming Webhook. Set TEAMS_WEBHOOK_URL to the webhook URL. This bypasses bot requirements entirely.',
                '2. Change Power Automate to post as "User" instead of "Flow bot": Edit your Power Automate flow, find "Post as" field and change to "User".',
                '3. Add Flow bot to the Teams channel: Type @Flow in the channel to add the bot.',
              ],
              documentation: 'See POWER_AUTOMATE_TEAMS_FIX.md for detailed instructions.',
            });

            // Don't retry for this error - it won't succeed without configuration changes
            throw new Error(
              'BotNotInConversationRoster: Bot is not part of the conversation. ' +
              'Use Teams Incoming Webhook or configure Power Automate to post as User. ' +
              'See POWER_AUTOMATE_TEAMS_FIX.md for details.'
            );
          }
        }

        // If this is not the last attempt, wait before retrying
        if (attempt < WEBHOOK_MAX_RETRIES) {
          await this.delay(WEBHOOK_RETRY_DELAY_MS);
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to send webhook after ${WEBHOOK_MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'
      }`
    );
  }

  /**
   * Check if the webhook URL is a Power Automate webhook
   *
   * @param webhookUrl - Webhook URL to check
   * @returns true if it's a Power Automate webhook, false otherwise
   */
  private isPowerAutomateWebhook(webhookUrl: string): boolean {
    try {
      const url = new URL(webhookUrl);
      return url.hostname.includes('powerplatform.com') ||
        url.hostname.includes('logic.azure.com') ||
        url.hostname.includes('prod-') && url.hostname.includes('.logic.azure.com');
    } catch {
      return false;
    }
  }

  /**
   * Format Adaptive Card payload for Power Automate webhooks
   *
   * Power Automate expects just the Adaptive Card content directly,
   * not wrapped in the message/attachments structure
   *
   * @param payload - Standard Teams Adaptive Card payload
   * @returns Formatted payload for Power Automate
   */
  private formatForPowerAutomate(payload: AdaptiveCardPayload): any {
    // Extract the Adaptive Card content from the attachments
    if (payload.attachments && payload.attachments.length > 0) {
      return payload.attachments[0].content;
    }
    return payload;
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
        logger.warn(`Webhook URL does not match expected Microsoft Teams domains: ${webhookUrl}`);
        // Still return true as Microsoft might use other domains
        // This is just a warning, not a hard validation
      }

      return true;
    } catch (error) {
      logger.error('Invalid webhook URL format', { webhookUrl });
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
