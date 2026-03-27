/**
 * Recap Analytics Utilities
 * Pure computation functions for generating monthly recap data.
 */

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MILLISECONDS_PER_DAY = 86_400_000;

/** Parse "HH:MM" time string (e.g. "3:30") or numeric value to decimal hours. */
export function parseTimeToHours(time: string | number): number {
  if (typeof time === 'number') return time;
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours + minutes / 60;
}

/**
 * Compute consecutive-day streaks from an array of date strings (YYYY-MM-DD).
 * "current" streak counts backwards from the last date in the array.
 */
export function computeStreaks(dates: string[]): { longest: number; current: number } {
  if (dates.length === 0) return { longest: 0, current: 0 };

  const unique = [...new Set(dates)].sort();
  const sortedDates = unique.map((d) => new Date(d).getTime());

  let longest = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = (sortedDates[i] - sortedDates[i - 1]) / MILLISECONDS_PER_DAY;
    if (diffDays === 1) {
      currentStreak++;
      longest = Math.max(longest, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  // "current" streak is the streak ending at the last date
  // We already have it from the loop above since currentStreak was last reset
  // at the final break, or carries through to the end.
  return { longest, current: currentStreak };
}

/** Find the busiest day (most hours logged) from logs. */
export function findBusiestDay(
  logs: Array<{ date: string; actual_time_spent: string | number; project_name?: string }>
): { date: string; totalHours: number; taskCount: number; topProject: string } {
  if (logs.length === 0) {
    return { date: '', totalHours: 0, taskCount: 0, topProject: '' };
  }

  const byDate = new Map<string, { hours: number; taskCount: number; projectHours: Map<string, number> }>();

  for (const log of logs) {
    const entry = byDate.get(log.date) ?? { hours: 0, taskCount: 0, projectHours: new Map<string, number>() };
    const hours = parseTimeToHours(log.actual_time_spent);
    entry.hours += hours;
    entry.taskCount++;

    const projectName = log.project_name ?? 'Unknown';
    entry.projectHours.set(projectName, (entry.projectHours.get(projectName) ?? 0) + hours);

    byDate.set(log.date, entry);
  }

  let busiestDate = '';
  let maxHours = -1;

  for (const [date, entry] of byDate) {
    if (entry.hours > maxHours) {
      maxHours = entry.hours;
      busiestDate = date;
    }
  }

  const busiest = byDate.get(busiestDate)!;
  let topProject = '';
  let topProjectHours = -1;
  for (const [name, hours] of busiest.projectHours) {
    if (hours > topProjectHours) {
      topProjectHours = hours;
      topProject = name;
    }
  }

  return {
    date: busiestDate,
    totalHours: busiest.hours,
    taskCount: busiest.taskCount,
    topProject,
  };
}

/** Compute hours distribution by day of week (Monday-Sunday). */
export function computeDayOfWeekDistribution(
  logs: Array<{ date: string; actual_time_spent: string | number }>
): { day: string; hours: number }[] {
  const hoursByDay = new Map<string, number>(DAYS_OF_WEEK.map((d) => [d, 0]));

  for (const log of logs) {
    const dayIndex = new Date(log.date).getUTCDay();
    const dayName = DAYS_OF_WEEK[dayIndex];
    hoursByDay.set(dayName, (hoursByDay.get(dayName) ?? 0) + parseTimeToHours(log.actual_time_spent));
  }

  // Return Monday through Sunday order
  const mondayFirst = [...DAYS_OF_WEEK.slice(1), DAYS_OF_WEEK[0]];
  return mondayFirst.map((day) => ({ day, hours: hoursByDay.get(day) ?? 0 }));
}

/** Find the most productive day of the week (highest total hours). */
export function findMostProductiveDayOfWeek(
  logs: Array<{ date: string; actual_time_spent: string | number }>
): string {
  const distribution = computeDayOfWeekDistribution(logs);
  if (distribution.length === 0) return '';

  let best = distribution[0];
  for (const entry of distribution) {
    if (entry.hours > best.hours) {
      best = entry;
    }
  }
  return best.day;
}

/** Rank a user among team members by hours. Returns 1-based rank and percentile. */
export function rankUserInTeam(
  userHours: number,
  allMemberHours: number[]
): { rank: number; percentile: number } {
  if (allMemberHours.length === 0) return { rank: 0, percentile: 0 };

  const sorted = [...allMemberHours].sort((a, b) => b - a);
  const rank = sorted.findIndex((h) => h <= userHours) + 1;
  const total = sorted.length;
  const percentile = ((total - rank) / total) * 100;

  return { rank, percentile: Math.round(percentile) };
}

/** Calculate total hours from an array of logs. */
export function calculateTotalHours(logs: Array<{ actual_time_spent: string | number }>): number {
  return logs.reduce((sum, log) => sum + parseTimeToHours(log.actual_time_spent), 0);
}

/** Aggregate hours by project, sorted descending by hours. */
export function aggregateByProject(
  logs: Array<{ project_id: number; project_name?: string; actual_time_spent: string | number }>
): Array<{ projectId: number; name: string; hours: number; percentage: number }> {
  const byProject = new Map<number, { name: string; hours: number }>();

  for (const log of logs) {
    const entry = byProject.get(log.project_id) ?? { name: log.project_name ?? 'Unknown', hours: 0 };
    entry.hours += parseTimeToHours(log.actual_time_spent);
    byProject.set(log.project_id, entry);
  }

  const totalHours = [...byProject.values()].reduce((sum, p) => sum + p.hours, 0);

  return [...byProject.entries()]
    .map(([projectId, { name, hours }]) => ({
      projectId,
      name,
      hours: Math.round(hours * 100) / 100,
      percentage: totalHours > 0 ? Math.round((hours / totalHours) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.hours - a.hours);
}
