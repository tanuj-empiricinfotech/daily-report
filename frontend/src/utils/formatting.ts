import { format, parseISO } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const formatDisplayDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const normalizeDateForComparison = (date: string | Date): string => {
  if (typeof date === 'string') {
    // Extract date part from ISO string (e.g., "2026-01-01T00:00:00.000Z" -> "2026-01-01")
    return date.split('T')[0];
  }
  return formatDate(date);
};

