/**
 * Configuration constants for scheduled jobs
 */

/**
 * Cron schedule for Teams daily summary job
 * Format: "minute hour day month dayOfWeek"
 * '30 14 * * *' = Every day at 14:30 UTC (8:00 PM IST)
 * IST is UTC+5:30, so 8:00 PM IST = 14:30 UTC (20:00 - 5:30 = 14:30)
 */
export const TEAMS_SUMMARY_CRON_SCHEDULE = '30 15 * * *'; // 9:00 PM IST = 15:30 UTC
// export const TEAMS_SUMMARY_CRON_SCHEDULE = '* * * * *';


/**
 * Timezone for cron scheduler
 * Note: We use UTC and convert IST times to UTC in the cron schedule
 */
export const CRON_TIMEZONE = 'UTC';

/**
 * Webhook request timeout in milliseconds
 */
export const WEBHOOK_TIMEOUT_MS = 10000;

/**
 * Maximum number of retry attempts for webhook failures
 */
export const WEBHOOK_MAX_RETRIES = 3;

/**
 * Delay between retry attempts in milliseconds
 */
export const WEBHOOK_RETRY_DELAY_MS = 2000;

/**
 * Whether to skip notifications for teams with no activity
 */
export const SKIP_EMPTY_SUMMARIES = true;

// ============================================================================
// Team Chat Configuration
// ============================================================================

/**
 * Cron schedule for vanishing messages cleanup job
 * Runs every 5 minutes to delete expired messages
 */
export const VANISHING_CLEANUP_CRON_SCHEDULE = '*/5 * * * *';

/**
 * SSE heartbeat interval in milliseconds
 * Sends a keep-alive ping to maintain connection
 */
export const SSE_HEARTBEAT_INTERVAL_MS = 30000;

/**
 * SSE connection timeout in milliseconds
 * Closes connections with no activity after this period
 */
export const SSE_CONNECTION_TIMEOUT_MS = 300000;

/**
 * Maximum message content length in characters
 */
export const MAX_MESSAGE_LENGTH = 5000;

/**
 * Default vanishing mode duration in hours
 */
export const DEFAULT_VANISHING_DURATION_HOURS = 24;

/**
 * Number of messages to fetch per page
 */
export const MESSAGES_PER_PAGE = 50;
