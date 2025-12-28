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

export const parseTimeInput = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return 0;
  
  return num;
};

export const validateTimeInput = (value: number): boolean => {
  return value >= 0 && !isNaN(value);
};

