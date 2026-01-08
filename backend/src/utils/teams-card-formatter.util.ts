/**
 * Utility to format Teams summary data as Microsoft Teams Adaptive Cards
 * Adaptive Cards documentation: https://adaptivecards.io/
 */

import { TeamsSummaryData, AdaptiveCardPayload, AdaptiveCardElement } from '../types/teams.types';
import { formatDateIST } from './timezone.util';
import { parseTimeToDecimal, formatDecimalToTime } from './time.util';

/**
 * Format time value to HH:MM display format
 * Handles both string (HH:MM) and number (decimal hours) formats for backward compatibility
 *
 * @param time - Time as string ("HH:MM") or number (decimal hours)
 * @returns Formatted time string (e.g., "3:30", "0:45", "12:15")
 */
function formatTime(time: string | number): string {
  // If it's already a string in HH:MM format, return as-is
  if (typeof time === 'string') {
    return time;
  }

  // If it's a number (decimal hours), convert to HH:MM format
  // For backward compatibility with old decimal format
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);

  // Handle edge case where rounding gives us 60 minutes
  if (minutes === 60) {
    return `${hours + 1}:00`;
  }

  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${hours}:${paddedMinutes}`;
}

/**
 * Convert team summary data to Microsoft Teams Adaptive Card format
 *
 * Creates a rich, formatted message card with:
 * - Title with date
 * - Team name and total hours
 * - Section for each user with their tasks
 * - Visual separators and formatting
 *
 * @param summary - The team summary data to format
 * @returns Adaptive Card payload ready to send to Teams webhook
 */
export function formatTeamsSummaryCard(summary: TeamsSummaryData): AdaptiveCardPayload {
  const cardBody: AdaptiveCardElement[] = [];

  // Title: "Daily Summary - [Date]"
  cardBody.push({
    type: 'TextBlock',
    text: `Daily Summary - ${formatDateIST(summary.date)}`,
    size: 'extraLarge',
    weight: 'bolder',
    color: 'accent',
    wrap: true,
    width: 'stretch',
  });

  // User sections
  summary.userSummaries.forEach((userSummary, _index) => {
    // User header
    cardBody.push({
      type: 'TextBlock',
      // text: `${userSummary.userName} (${formatHours(userSummary.totalActualTime)} actual, ${formatHours(userSummary.totalTrackedTime)} tracked)`,
      text: `${userSummary.userName}`,
      size: 'medium',
      weight: 'bolder',
      separator: true,
      spacing: 'default',
      wrap: true,
      width: 'stretch',
    });

    // User's tasks grouped by project
    const tasksByProject = new Map<string, typeof userSummary.tasks>();
    userSummary.tasks.forEach(task => {
      const projectTasks = tasksByProject.get(task.projectName) || [];
      projectTasks.push(task);
      tasksByProject.set(task.projectName, projectTasks);
    });

    // Display tasks grouped by project
    tasksByProject.forEach((tasks, projectName) => {
      // Calculate total tracked time for this project
      // Convert each task's trackedTime to decimal hours, sum them, then format back to HH:MM
      const projectTrackedTimeDecimal = tasks.reduce((sum, task) => {
        const timeDecimal = typeof task.trackedTime === 'string'
          ? parseTimeToDecimal(task.trackedTime)
          : task.trackedTime;
        return sum + timeDecimal;
      }, 0);

      // Format the total back to HH:MM string format
      const projectTrackedTime = formatDecimalToTime(projectTrackedTimeDecimal);

      // Project tracked time if not 0
      if (projectTrackedTime !== "0:00") {
        cardBody.push({
          type: 'TextBlock',
          text: `Tracked Time: ${projectTrackedTime}`,
          size: 'medium',
          weight: 'default',
          spacing: 'small',
          wrap: true,
          width: 'stretch',
        });
      }
      // Project name with total time
      cardBody.push({
        type: 'TextBlock',
        text: `${projectName}`,
        size: 'medium',
        weight: 'default',
        spacing: 'small',
        wrap: true,
        width: 'stretch',
      });

      // Tasks under this project
      tasks.forEach(task => {
        // const taskText = `• ${task.taskDescription} - ${formatHours(task.actualTime)} (actual) / ${formatHours(task.trackedTime)} (tracked)`;
        const taskText = `${task.taskDescription}`;
        cardBody.push({
          type: 'TextBlock',
          text: taskText,
          spacing: 'none',
          wrap: true,
          width: 'stretch',
        });
      });
    });
  });

  // Team name and total hours
  // cardBody.push({
  //   type: 'FactSet',
  //   facts: [
  //     // {
  //     //   title: 'Team',
  //     //   value: summary.teamName,
  //     // },
  //     {
  //       title: 'Total Actual Time',
  //       value: formatTime(summary.totalTeamActualTime),
  //     },
  //     {
  //       title: 'Total Tracked Time',
  //       value: formatTime(summary.totalTeamTrackedTime),
  //     },
  //   ],
  //   separator: true,
  //   spacing: 'medium',
  //   width: 'stretch',
  // });

  // Footer
  cardBody.push({
    type: 'TextBlock',
    text: 'Generated by Daily Report System',
    size: 'small',
    color: 'default',
    separator: true,
    spacing: 'medium',
    wrap: true,
    width: 'stretch',
    weight: 'lighter',
  });

  // Construct the Adaptive Card payload
  // All elements have width: 'stretch' to ensure full width usage
  const payload: AdaptiveCardPayload = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: cardBody,
        },
      },
    ],
  };

  return payload;
}
