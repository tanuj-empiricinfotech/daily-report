/**
 * Date utility functions
 *
 * IMPORTANT: For date-only values (YYYY-MM-DD), we should NOT apply timezone conversions.
 * Dates represent calendar days and should be timezone-agnostic.
 *
 * The database stores dates as PostgreSQL DATE type (date-only, no time component).
 * These should be stored and retrieved as plain YYYY-MM-DD strings without timezone conversion.
 */

/**
 * Validates and normalizes a date string to YYYY-MM-DD format
 *
 * For date-only values, no timezone conversion is applied.
 * The date string is returned as-is if valid, ensuring calendar dates
 * remain consistent regardless of timezone.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Normalized date string in YYYY-MM-DD format
 */
export function normalizeDate(dateString: string): string {
  if (!dateString) {
    return dateString;
  }

  // Extract date part if datetime string is provided
  const datePart = dateString.split('T')[0];

  // Validate YYYY-MM-DD format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(datePart)) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD format.`);
  }

  return datePart;
}

/**
 * Formats a Date object to YYYY-MM-DD string
 * Uses the date components in the user's local timezone
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string (YYYY-MM-DD) to a Date object
 * The Date object represents the date in the user's local timezone
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the date in local timezone
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the current date in IST timezone as YYYY-MM-DD string
 *
 * IST is UTC+5:30, so we add 5 hours and 30 minutes to UTC time
 * to get the current date in Indian timezone
 *
 * @returns Current date in IST as YYYY-MM-DD format
 */
export function getCurrentDateIST(): string {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is in the past (before current IST date)
 *
 * Compares the provided date with the current date in IST timezone
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if the date is before today (IST), false otherwise
 */
export function isDateInPast(dateString: string): boolean {
  const currentDate = getCurrentDateIST();
  return dateString < currentDate;
}

/**
 * Check if a date is today (current IST date)
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if the date is today (IST), false otherwise
 */
export function isDateToday(dateString: string): boolean {
  const currentDate = getCurrentDateIST();
  return dateString === currentDate;
}

/**
 * Check if a date is in the future (after current IST date)
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if the date is after today (IST), false otherwise
 */
export function isDateInFuture(dateString: string): boolean {
  const currentDate = getCurrentDateIST();
  return dateString > currentDate;
}

/**
 * Legacy function names kept for backward compatibility
 * These now simply normalize the date string without timezone conversion
 */

/** @deprecated Use normalizeDate instead. Kept for backward compatibility. */
export function istToIso(dateString: string): string {
  return normalizeDate(dateString);
}

/** @deprecated Use normalizeDate instead. Kept for backward compatibility. */
export function isoToIst(dateString: string): string {
  return normalizeDate(dateString);
}
