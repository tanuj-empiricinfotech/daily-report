/**
 * Configuration constants for scheduled jobs
 */

/**
 * Cron schedule for Teams daily summary job
 * Format: "minute hour day month dayOfWeek"
 * '30 14 * * *' = Every day at 14:30 UTC (8:00 PM IST)
 * IST is UTC+5:30, so 8:00 PM IST = 14:30 UTC (20:00 - 5:30 = 14:30)
 */
export const TEAMS_SUMMARY_CRON_SCHEDULE = '30 16 * * *'; // 8:00 PM IST = 14:30 UTC
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
