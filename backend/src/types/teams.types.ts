/**
 * TypeScript type definitions for Microsoft Teams integration
 */

/**
 * Summary of tasks for a single user on a specific date
 */
export interface UserDailySummary {
  userId: number;
  userName: string;
  totalActualTime: string | number;  // HH:MM format string or decimal number for backward compatibility
  totalTrackedTime: string | number;  // HH:MM format string or decimal number for backward compatibility
  tasks: TaskSummary[];
}

/**
 * Individual task summary with project information
 */
export interface TaskSummary {
  projectId: number;
  projectName: string;
  taskDescription: string;
  actualTime: string | number;  // HH:MM format string or decimal number for backward compatibility
  trackedTime: string | number;  // HH:MM format string or decimal number for backward compatibility
}

/**
 * Complete daily summary for a team
 */
export interface TeamsSummaryData {
  teamId: number;
  teamName: string;
  date: string; // YYYY-MM-DD format
  userSummaries: UserDailySummary[];
  totalTeamActualTime: string | number;  // HH:MM format string or decimal number for backward compatibility
  totalTeamTrackedTime: string | number;  // HH:MM format string or decimal number for backward compatibility
}

/**
 * Teams Adaptive Card format for rich messaging
 * See: https://adaptivecards.io/designer/
 */
export interface AdaptiveCardPayload {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: {
      type: 'AdaptiveCard';
      version: string;
      body: AdaptiveCardElement[];
    };
  }>;
}

/**
 * Adaptive Card element types
 */
export type AdaptiveCardElement =
  | TextBlock
  | FactSet
  | Container
  | ColumnSet;

export interface TextBlock {
  type: 'TextBlock';
  text: string;
  size?: 'small' | 'medium' | 'large' | 'extraLarge';
  weight?: 'lighter' | 'default' | 'bolder';
  color?: 'default' | 'accent' | 'good' | 'warning' | 'attention';
  wrap?: boolean;
  separator?: boolean;
  spacing?: 'none' | 'small' | 'default' | 'medium' | 'large' | 'extraLarge';
  width?: 'auto' | 'stretch' | number;
}

export interface FactSet {
  type: 'FactSet';
  facts: Array<{
    title: string;
    value: string;
  }>;
  separator?: boolean;
  spacing?: 'none' | 'small' | 'default' | 'medium' | 'large' | 'extraLarge';
  width?: 'auto' | 'stretch' | number;
}

export interface Container {
  type: 'Container';
  items: AdaptiveCardElement[];
  separator?: boolean;
  spacing?: 'none' | 'small' | 'default' | 'medium' | 'large' | 'extraLarge';
  width?: 'auto' | 'stretch' | number;
}

export interface ColumnSet {
  type: 'ColumnSet';
  columns: Array<{
    type: 'Column';
    width?: 'auto' | 'stretch' | number;
    items: AdaptiveCardElement[];
  }>;
  separator?: boolean;
  spacing?: 'none' | 'small' | 'default' | 'medium' | 'large' | 'extraLarge';
}

/**
 * Result from sending a notification to Teams
 */
export interface TeamsNotificationResult {
  success: boolean;
  teamId: number;
  teamName: string;
  error?: string;
}
