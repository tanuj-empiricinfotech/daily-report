/**
 * Type definitions for Dashboard components
 * Follows type safety principle - explicit, well-documented types
 */

/**
 * Represents a row in the team hours tracking table
 */
export interface TeamHoursRow {
  /** User ID */
  userId: number;
  /** User's full name */
  userName: string;
  /** User's email address */
  userEmail: string;
  /** User's role */
  role: 'admin' | 'member';
  /** Number of unique projects worked on */
  projectsCount: number;
  /** Comma-separated list of project names */
  projectsList: string;
  /** Total hours logged (decimal) */
  totalHours: number;
  /** Number of log entries */
  logsCount: number;
}
