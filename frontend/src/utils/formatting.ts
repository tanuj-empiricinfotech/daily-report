import { format, parseISO } from 'date-fns';
import { isoToIst } from './date';

/**
 * Formats a date to YYYY-MM-DD string in IST
 * Input can be ISO date string (from API) or Date object
 */
export const formatDate = (date: string | Date): string => {
  if (typeof date === 'string') {
    // If it's already a date string, convert from ISO to IST
    return isoToIst(date.split('T')[0]);
  }
  // For Date objects, format directly (assumes local timezone is IST)
  return format(date, 'yyyy-MM-dd');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

/**
 * Formats a date for display in IST
 * Input can be ISO date string (from API) or Date object
 */
export const formatDisplayDate = (date: string | Date): string => {
  if (typeof date === 'string') {
    // Convert ISO to IST first, then format
    const istDate = isoToIst(date.split('T')[0]);
    const dateObj = parseISO(istDate + 'T00:00:00');
    return format(dateObj, 'MMM dd, yyyy');
  }
  return format(date, 'MMM dd, yyyy');
};

/**
 * Normalizes a date string for comparison (returns IST date string)
 */
export const normalizeDateForComparison = (date: string | Date): string => {
  if (typeof date === 'string') {
    // Extract date part and convert from ISO to IST
    const datePart = date.split('T')[0];
    return isoToIst(datePart);
  }
  return formatDate(date);
};

