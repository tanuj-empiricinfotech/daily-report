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
      console.log('Formatting summary for team:', summary);
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

    // Detect webhook type and format payload accordingly
    const isPowerAutomateWebhook = this.isPowerAutomateWebhook(webhookUrl);
    const requestPayload = isPowerAutomateWebhook
      ? this.formatForPowerAutomate(payload)
      : payload;

    console.log('Webhook type:', isPowerAutomateWebhook ? 'Power Automate' : 'Teams Incoming Webhook');
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    for (let attempt = 1; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(webhookUrl, requestPayload, {
          timeout: WEBHOOK_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Log success details
        console.log('Webhook request succeeded:');
        console.log('  Status:', response.status, response.statusText);
        console.log('  Response data:', JSON.stringify(response.data, null, 2));
        console.log('  Response headers:', JSON.stringify(response.headers, null, 2));

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

        console.warn(
          `Webhook attempt ${attempt}/${WEBHOOK_MAX_RETRIES} failed:`,
          `Status: ${statusCode},`,
          `Error: ${errorMessage}`
        );
        console.warn('  Response data:', JSON.stringify(responseData, null, 2));

        // Check for specific error types and provide helpful guidance
        if (statusCode === 403) {
          const errorData = isAxiosError && (error as AxiosError).response?.data;
          const errorBody = typeof errorData === 'object' ? errorData : {};
          const nestedError = (errorBody as any)?.error;

          if (nestedError?.code === 'BotNotInConversationRoster' ||
            (typeof nestedError === 'string' && nestedError.includes('BotNotInConversationRoster'))) {
            console.error('');
            console.error('⚠️  BOT NOT IN CONVERSATION ROSTER ERROR DETECTED');
            console.error('This error occurs when Power Automate uses Bot Framework and the bot is not in the conversation.');
            console.error('');
            console.error('SOLUTIONS:');
            console.error('1. Use Teams Incoming Webhook instead (recommended):');
            console.error('   - Get webhook URL from Teams channel > Connectors > Incoming Webhook');
            console.error('   - Set TEAMS_WEBHOOK_URL to the webhook URL');
            console.error('   - This bypasses bot requirements entirely');
            console.error('');
            console.error('2. Change Power Automate to post as "User" instead of "Flow bot"');
            console.error('   - Edit your Power Automate flow');
            console.error('   - Find "Post as" field and change to "User"');
            console.error('');
            console.error('3. Add Flow bot to the Teams channel');
            console.error('   - Type @Flow in the channel to add the bot');
            console.error('');
            console.error('See POWER_AUTOMATE_TEAMS_FIX.md for detailed instructions.');
            console.error('');

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
