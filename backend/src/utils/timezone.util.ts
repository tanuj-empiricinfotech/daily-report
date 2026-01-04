/**
 * Timezone utility functions for IST (India Standard Time) conversions
 * IST is UTC+5:30
 */

/**
 * Get the current date in IST timezone as YYYY-MM-DD string
 *
 * This function calculates the IST date by adding 5 hours and 30 minutes
 * to the current UTC time, then extracts the date portion.
 *
 * @returns Current date in IST as YYYY-MM-DD format
 *
 * @example
 * // If current UTC time is 2026-01-03 19:00:00
 * getCurrentDateIST() // Returns "2026-01-04"
 * // (19:00 + 5:30 = 00:30 next day)
 */
export function getCurrentDateIST(): string {
  const now = new Date();

  // IST is UTC + 5:30
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  // Get current time in IST
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);

  // Extract date in YYYY-MM-DD format
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convert IST time to UTC hour for cron scheduling
 *
 * @param istHour - Hour in IST (0-23)
 * @param istMinute - Minute in IST (0-59)
 * @returns Object with UTC hour and minute
 *
 * @example
 * // 8:30 PM IST = 20:30 IST = 15:00 UTC
 * istToUTCHour(20, 30) // Returns { hour: 15, minute: 0 }
 */
export function istToUTCHour(istHour: number, istMinute: number = 0): { hour: number; minute: number } {
  // IST is UTC + 5:30
  const IST_OFFSET_HOURS = 5;
  const IST_OFFSET_MINUTES = 30;

  // Convert IST to total minutes
  let totalMinutes = istHour * 60 + istMinute;

  // Subtract IST offset
  totalMinutes -= IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES;

  // Handle day boundary (negative minutes means previous day)
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  // Convert back to hours and minutes
  const utcHour = Math.floor(totalMinutes / 60) % 24;
  const utcMinute = totalMinutes % 60;

  return { hour: utcHour, minute: utcMinute };
}

/**
 * Format a date for display in IST timezone
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 *
 * @example
 * formatDateIST('2026-01-03') // Returns "January 3, 2026"
 */
export function formatDateIST(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
