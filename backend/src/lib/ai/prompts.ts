/**
 * System Prompt Builder
 *
 * Constructs context-aware system prompts for the AI assistant
 * incorporating user's daily logs for personalized conversations.
 */

import type { ChatContext, LogContext } from './types';

const MAX_LOGS_IN_CONTEXT = 100;

/**
 * Format a single log entry for inclusion in the system prompt
 */
function formatLogEntry(log: LogContext): string {
  const timeInfo = log.actualTimeSpent
    ? `Actual: ${log.actualTimeSpent}, Tracked: ${log.trackedTime}`
    : `Tracked: ${log.trackedTime}`;

  return `- [${log.date}] ${log.projectName}: ${log.taskDescription} (${timeInfo})`;
}

/**
 * Format all logs into a readable summary for the system prompt
 */
function formatLogsForContext(logs: LogContext[]): string {
  if (logs.length === 0) {
    return 'No work logs available for the selected period.';
  }

  // Limit logs to prevent context overflow
  const logsToInclude = logs.slice(0, MAX_LOGS_IN_CONTEXT);
  const formattedLogs = logsToInclude.map(formatLogEntry).join('\n');

  const summary = logs.length > MAX_LOGS_IN_CONTEXT
    ? `\n\n(Showing ${MAX_LOGS_IN_CONTEXT} of ${logs.length} total logs)`
    : '';

  return formattedLogs + summary;
}

/**
 * Calculate summary statistics from logs
 */
function calculateLogStats(logs: LogContext[]): {
  totalLogs: number;
  uniqueProjects: number;
  dateRange: string;
} {
  const projectNames = new Set(logs.map(log => log.projectName));
  const dates = logs.map(log => log.date).sort();

  return {
    totalLogs: logs.length,
    uniqueProjects: projectNames.size,
    dateRange: dates.length > 0
      ? dates.length === 1
        ? dates[0]
        : `${dates[0]} to ${dates[dates.length - 1]}`
      : 'No dates',
  };
}

/**
 * Build the system prompt with user's logs context
 *
 * @param context - User information and their work logs
 * @returns System prompt string for the AI model
 */
export function buildSystemPrompt(context: ChatContext): string {
  const { userName, logs, dateRange } = context;
  const stats = calculateLogStats(logs);
  const formattedLogs = formatLogsForContext(logs);

  const dateRangeInfo = dateRange
    ? `Date range: ${dateRange.startDate} to ${dateRange.endDate}`
    : `Date range: ${stats.dateRange}`;

  return `You are a helpful AI assistant for a daily work logging application. You are having a conversation with ${userName} about their work logs and productivity.

## Context
${dateRangeInfo}
Total entries: ${stats.totalLogs}
Projects: ${stats.uniqueProjects}

## Work Logs
${formattedLogs}

## Capabilities
You can help ${userName} with:
1. **Summarizing work** - Provide daily, weekly, or project-based summaries
2. **Analyzing patterns** - Identify trends in time tracking, project focus, and productivity
3. **Generating reports** - Create formatted reports for different purposes
4. **Answering questions** - Answer specific questions about logged work
5. **Providing insights** - Offer observations about work patterns and time allocation

## Guidelines
- Be concise and helpful in your responses
- Reference specific log entries when relevant
- If asked about data not in the logs, acknowledge the limitation
- Use the actual project names and dates from the logs
- When discussing time, reference both actual and tracked time if available
- Be encouraging but honest about productivity patterns
- Format responses clearly using markdown when helpful`;
}

/**
 * Build a minimal system prompt when no logs are available
 */
export function buildMinimalSystemPrompt(userName: string): string {
  return `You are a helpful AI assistant for a daily work logging application. You are having a conversation with ${userName}.

Currently, there are no work logs loaded for context. You can:
- Answer general questions about productivity and time management
- Explain how to use the work logging features
- Help plan future work tasks

To get personalized insights about work, ask ${userName} to select a date range to load their logs.`;
}
