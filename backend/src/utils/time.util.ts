/**
 * Time utility functions for handling HH:MM format
 *
 * Supports:
 * - Parsing "HH:MM" string format to decimal hours
 * - Formatting decimal hours to "HH:MM" string format
 * - Validation of time format
 * - Handling empty/blank values as 0
 */

const TIME_FORMAT_REGEX = /^(\d+):([0-5]\d)$/;

/**
 * Parse time string in HH:MM format to decimal hours
 *
 * @param timeString - Time in "HH:MM" format (e.g., "3:30", "0:45", "12:15")
 * @returns Decimal hours (e.g., 3.5, 0.75, 12.25)
 * @throws Error if format is invalid
 *
 * @example
 * parseTimeToDecimal("3:30") // returns 3.5
 * parseTimeToDecimal("0:45") // returns 0.75
 * parseTimeToDecimal("12:15") // returns 12.25
 * parseTimeToDecimal("") // returns 0
 * parseTimeToDecimal("0:00") // returns 0
 */
export function parseTimeToDecimal(timeString: string | null | undefined): number {
  // Handle empty/blank/null values as 0
  if (!timeString || timeString.trim() === '') {
    return 0;
  }

  const trimmed = timeString.trim();

  // Check if it matches HH:MM format
  const match = trimmed.match(TIME_FORMAT_REGEX);

  if (!match) {
    throw new Error(`Invalid time format: "${timeString}". Expected format: HH:MM (e.g., "3:30")`);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // Validate reasonable ranges
  if (hours < 0 || hours > 999) {
    throw new Error(`Hours must be between 0 and 999, got ${hours}`);
  }

  if (minutes < 0 || minutes > 59) {
    throw new Error(`Minutes must be between 0 and 59, got ${minutes}`);
  }

  // Convert to decimal hours
  return hours + (minutes / 60);
}

/**
 * Format decimal hours to HH:MM string format
 *
 * @param decimalHours - Time in decimal hours (e.g., 3.5, 0.75, 12.25)
 * @returns Time string in "HH:MM" format (e.g., "3:30", "0:45", "12:15")
 *
 * @example
 * formatDecimalToTime(3.5) // returns "3:30"
 * formatDecimalToTime(0.75) // returns "0:45"
 * formatDecimalToTime(12.25) // returns "12:15"
 * formatDecimalToTime(0) // returns "0:00"
 */
export function formatDecimalToTime(decimalHours: number): string {
  // Handle negative values as 0
  if (decimalHours < 0) {
    decimalHours = 0;
  }

  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  // Handle edge case where rounding gives us 60 minutes
  if (minutes === 60) {
    return `${hours + 1}:00`;
  }

  // Pad minutes with leading zero if needed
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${hours}:${paddedMinutes}`;
}

/**
 * Validate if a string is in valid HH:MM format
 * Also accepts empty/blank strings as valid (representing 0)
 *
 * @param timeString - Time string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidTimeFormat("3:30") // returns true
 * isValidTimeFormat("12:00") // returns true
 * isValidTimeFormat("") // returns true (blank is valid)
 * isValidTimeFormat("3:60") // returns false (invalid minutes)
 * isValidTimeFormat("abc") // returns false
 */
export function isValidTimeFormat(timeString: string | null | undefined): boolean {
  // Empty/blank/null is valid (represents 0)
  if (!timeString || timeString.trim() === '') {
    return true;
  }

  const trimmed = timeString.trim();
  const match = trimmed.match(TIME_FORMAT_REGEX);

  if (!match) {
    return false;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // Validate reasonable ranges
  return hours >= 0 && hours <= 999 && minutes >= 0 && minutes <= 59;
}

/**
 * Normalize time input - accepts both HH:MM string and decimal number
 * Converts to decimal hours for storage
 *
 * @param timeInput - Time as string ("HH:MM") or number (decimal hours)
 * @returns Decimal hours
 * @throws Error if format is invalid
 *
 * @example
 * normalizeTimeInput("3:30") // returns 3.5
 * normalizeTimeInput(3.5) // returns 3.5
 * normalizeTimeInput("") // returns 0
 * normalizeTimeInput(null) // returns 0
 */
export function normalizeTimeInput(timeInput: string | number | null | undefined): number {
  if (typeof timeInput === 'number') {
    return timeInput >= 0 ? timeInput : 0;
  }

  return parseTimeToDecimal(timeInput);
}
