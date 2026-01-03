/**
 * Utility functions for date conversion between IST and ISO formats
 * IST (Indian Standard Time) is UTC+5:30
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Converts an IST date string (YYYY-MM-DD) to ISO date string (YYYY-MM-DD) in UTC
 * Since we're dealing with date-only values, we need to ensure the date is interpreted
 * in IST timezone and then converted to UTC for storage
 */
export function istToIso(istDateString: string): string {
  if (!istDateString) {
    return istDateString;
  }

  // Parse the date string as if it's in IST
  // Create a date at midnight IST, then convert to UTC
  const [year, month, day] = istDateString.split('-').map(Number);
  const istDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  
  // Subtract IST offset to get UTC equivalent
  // If it's 2024-01-01 00:00:00 IST, it's actually 2023-12-31 18:30:00 UTC
  const utcDate = new Date(istDate.getTime() - IST_OFFSET_MS);
  
  // Return as YYYY-MM-DD string
  return utcDate.toISOString().split('T')[0];
}

/**
 * Converts an ISO date string (YYYY-MM-DD) in UTC to IST date string (YYYY-MM-DD)
 * Since dates are stored in UTC, we need to convert them back to IST for display
 */
export function isoToIst(isoDateString: string): string {
  if (!isoDateString) {
    return isoDateString;
  }

  // Parse the ISO date string as UTC
  const datePart = isoDateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  
  // Add IST offset to get IST equivalent
  const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
  
  // Return as YYYY-MM-DD string
  const istYear = istDate.getUTCFullYear();
  const istMonth = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const istDay = String(istDate.getUTCDate()).padStart(2, '0');
  
  return `${istYear}-${istMonth}-${istDay}`;
}

/**
 * Converts a Date object to IST date string (YYYY-MM-DD)
 * The Date object is assumed to be in the user's local timezone (IST)
 */
export function dateToIstString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts an IST date string (YYYY-MM-DD) to a Date object
 * The Date object will represent the date in the user's local timezone
 */
export function istStringToDate(istDateString: string): Date {
  const [year, month, day] = istDateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
