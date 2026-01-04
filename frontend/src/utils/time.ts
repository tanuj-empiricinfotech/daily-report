/**
 * Formats time string (HH:MM) to display format (e.g., "3:30" -> "3h 30m")
 * Also supports decimal format for backward compatibility
 */
export const formatTimeDisplay = (time: string | number): string => {
  if (typeof time === 'number') {
    // Legacy decimal format
    const wholeHours = Math.floor(time);
    const minutes = Math.round((time - wholeHours) * 60);

    if (wholeHours === 0) {
      return `${minutes}m`;
    }
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h ${minutes}m`;
  }

  // String format (HH:MM)
  const trimmed = time.trim();
  if (!trimmed || trimmed === '0:00') return '0m';

  const parts = trimmed.split(':');
  if (parts.length !== 2) return '0m';

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return '0m';

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

/**
 * @deprecated Use formatTimeDisplay instead
 * Formats decimal hours to display format (e.g., 3.5 -> "3h 30m")
 */
export const formatDecimalHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
};

/**
 * Converts decimal hours to HH:MM format for input fields
 * @param hours - Decimal hours (e.g., 3.5)
 * @returns String in HH:MM format (e.g., "3:30")
 */
export const formatTimeToInput = (hours: number): string => {
  if (!hours || hours === 0) return '';

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Parses HH:MM format to decimal hours
 * Supports formats: "3:30", "3:0", "0:30", blank/empty
 * @param value - Time string in HH:MM format
 * @returns Decimal hours or 0 if invalid/blank
 */
export const parseTimeInput = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  // Check if input contains colon (HH:MM format)
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
      return 0;
    }

    return hours + minutes / 60;
  }

  // Fallback: treat as decimal number for backward compatibility
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return 0;

  return num;
};

/**
 * Validates time input value
 * Allows 0 or positive numbers
 */
export const validateTimeInput = (value: number): boolean => {
  return value >= 0 && !isNaN(value);
};

/**
 * Validates HH:MM format string
 * @param value - Time string to validate
 * @returns true if valid HH:MM format or blank, false otherwise
 */
export const validateTimeFormat = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true; // Blank is valid

  if (!trimmed.includes(':')) {
    // Check if it's a valid decimal number
    const num = parseFloat(trimmed);
    return !isNaN(num) && num >= 0;
  }

  const parts = trimmed.split(':');
  if (parts.length !== 2) return false;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && minutes >= 0 && minutes < 60;
};

/**
 * Sums an array of time strings in HH:MM format
 * @param times - Array of time strings (e.g., ["3:30", "2:15"])
 * @returns Total time as decimal hours
 */
export const sumTimeStrings = (times: string[]): number => {
  return times.reduce((sum, time) => sum + parseTimeInput(time), 0);
};

