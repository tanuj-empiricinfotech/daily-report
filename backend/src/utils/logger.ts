/**
 * Logging utility with environment-based log levels
 * 
 * In production: only logs error and warn levels
 * In development: logs all levels (error, warn, info, debug)
 * 
 * Automatically sanitizes sensitive data from logs
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitizes sensitive data from log messages
 * Removes passwords, tokens, and other sensitive information
 */
function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized: any = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'apikey', 'authorization', 'cookie'];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Formats log message with timestamp and level
 */
function formatLogMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data !== undefined) {
    const sanitizedData = sanitizeLogData(data);
    return `${prefix} ${message} ${JSON.stringify(sanitizedData)}`;
  }
  
  return `${prefix} ${message}`;
}

/**
 * Logger class with environment-aware logging
 */
class Logger {
  error(message: string, data?: any): void {
    console.error(formatLogMessage('error', message, data));
  }

  warn(message: string, data?: any): void {
    if (isProduction || isDevelopment) {
      console.warn(formatLogMessage('warn', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(formatLogMessage('info', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(formatLogMessage('debug', message, data));
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
