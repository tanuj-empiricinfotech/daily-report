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
 * Indian national and major holidays (month-day).
 * Fixed-date holidays observed nationwide. Dates that shift yearly
 * (e.g. Diwali, Eid, Holi) are included with their most common dates.
 */
const INDIAN_HOLIDAYS: Record<number, number[][]> = {
  // [month, day] pairs grouped by year-independent fixed holidays
  // These are checked every year
  0: [], // placeholder — actual data is in getIndianHolidays()
};

function getIndianHolidays(year: number): Set<string> {
  const holidays = new Set<string>();
  const add = (m: number, d: number) =>
    holidays.add(`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

  // Fixed national holidays
  add(1, 26);  // Republic Day
  add(8, 15);  // Independence Day
  add(10, 2);  // Gandhi Jayanti
  add(1, 1);   // New Year's Day
  add(5, 1);   // May Day / Labour Day
  add(12, 25); // Christmas

  // Major holidays (approximate common dates — these shift yearly)
  // 2026 dates
  if (year === 2026) {
    add(3, 4);   // Holi
    add(3, 20);  // Eid ul-Fitr (approx)
    add(3, 30);  // Ram Navami
    add(4, 3);   // Good Friday
    add(4, 14);  // Ambedkar Jayanti
    add(5, 27);  // Eid ul-Adha (approx)
    add(6, 26);  // Muharram (approx)
    add(8, 6);   // Janmashtami
    add(8, 25);  // Milad-un-Nabi (approx)
    add(10, 9);  // Dussehra
    add(10, 21); // Diwali (Lakshmi Puja)
    add(10, 22); // Diwali holiday
    add(11, 24); // Guru Nanak Jayanti
  }
  // 2027 dates
  if (year === 2027) {
    add(3, 22);  // Holi
    add(3, 10);  // Eid ul-Fitr (approx)
    add(3, 26);  // Good Friday
    add(4, 14);  // Ambedkar Jayanti
    add(4, 18);  // Ram Navami
    add(5, 17);  // Eid ul-Adha (approx)
    add(6, 15);  // Muharram (approx)
    add(8, 25);  // Janmashtami
    add(8, 14);  // Milad-un-Nabi (approx)
    add(9, 28);  // Dussehra
    add(10, 10); // Diwali
    add(11, 14); // Guru Nanak Jayanti
  }

  return holidays;
}

/** Check if a date is a weekend (Saturday or Sunday). */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Check if a date string (YYYY-MM-DD) is a non-working day (weekend or Indian holiday). */
function isNonWorkingDay(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isWeekend(date)) return true;
  const year = date.getUTCFullYear();
  return getIndianHolidays(year).has(dateStr);
}

/**
 * Check if all days between two dates (exclusive) are non-working days.
 * Returns true if the gap between dateA and dateB contains only weekends/holidays.
 */
function isGapAllNonWorking(dateA: string, dateB: string): boolean {
  const start = new Date(dateA);
  const end = new Date(dateB);
  const cursor = new Date(start);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor < end) {
    const cursorStr = cursor.toISOString().split('T')[0];
    if (!isNonWorkingDay(cursorStr)) return false;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return true;
}

/**
 * Compute working-day streaks from an array of date strings (YYYY-MM-DD).
 * Weekends and Indian holidays do NOT break a streak — only missed working days do.
 * "current" streak counts backwards from the last date in the array.
 */
export function computeStreaks(dates: string[]): { longest: number; current: number } {
  if (dates.length === 0) return { longest: 0, current: 0 };

  const unique = [...new Set(dates)].sort();

  let longest = 1;
  let currentStreak = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = unique[i - 1];
    const curr = unique[i];
    const diffDays = (new Date(curr).getTime() - new Date(prev).getTime()) / MILLISECONDS_PER_DAY;

    // Consecutive day — streak continues
    if (diffDays === 1) {
      currentStreak++;
    }
    // Gap exists — check if all gap days are non-working
    else if (isGapAllNonWorking(prev, curr)) {
      currentStreak++;
    }
    // Working day was missed — streak breaks
    else {
      currentStreak = 1;
    }

    longest = Math.max(longest, currentStreak);
  }

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
