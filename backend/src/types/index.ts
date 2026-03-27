export type UserRole = 'admin' | 'member';

// Re-export team chat types
export * from './team-chat.types';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  team_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  webhook_url: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  joined_at: Date;
}

export interface Project {
  id: number;
  team_id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectAssignment {
  id: number;
  project_id: number;
  user_id: number;
  assigned_at: Date;
}

export interface UserWithProjects extends Omit<User, 'password_hash'> {
  projects: Array<Omit<Project, 'team_id' | 'created_by'> & {
    assigned_at: Date;
  }>;
}

export interface UserWithProjectsAndTeam extends UserWithProjects {
  team_name: string | null;
}

export interface DailyLog {
  id: number;
  user_id: number;
  project_id: number;
  date: string;  // Date-only value in YYYY-MM-DD format (timezone-agnostic)
  task_description: string;
  actual_time_spent: string;  // Time in "HH:MM" format (e.g., "3:30") or decimal number from DB
  tracked_time: string;  // Time in "HH:MM" format (e.g., "3:30") or decimal number from DB
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  team_id?: number | null;
  is_active?: boolean;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  webhook_url?: string;
}

export interface CreateProjectDto {
  team_id: number;
  name: string;
  description?: string;
}

export interface CreateLogDto {
  user_id?: number;  // Optional - if provided (admin only), create log for this user
  project_id: number;
  date: string;
  task_description: string;
  actual_time_spent: string;  // Time in "HH:MM" format (e.g., "3:30") or empty string for 0
  tracked_time: string;  // Time in "HH:MM" format (e.g., "3:30") or empty string for 0
}

export interface UpdateLogDto {
  project_id?: number;
  date?: string;
  task_description?: string;
  actual_time_spent?: string;  // Time in "HH:MM" format (e.g., "3:30") or empty string for 0
  tracked_time?: string;  // Time in "HH:MM" format (e.g., "3:30") or empty string for 0
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// Monthly Recap Types
export interface MonthlyRecap {
  id: number;
  user_id: number;
  month: number;
  year: number;
  slides_data: RecapSlide[];
  last_viewed_slide: number;
  is_partial: boolean;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export type RecapSlide =
  | WelcomeSlide
  | TotalHoursSlide
  | TopProjectsSlide
  | BusiestDaySlide
  | StreaksPatternsSlide
  | AIInsightSlide
  | TeamStandingSlide
  | SummarySlide;

export interface WelcomeSlide {
  type: 'welcome';
  userName: string;
  monthName: string;
  year: number;
  totalLogs: number;
}

export interface TotalHoursSlide {
  type: 'total-hours';
  totalHours: number;
  avgHoursPerDay: number;
  totalDaysLogged: number;
  comparisonToPrevMonth: number;
}

export interface TopProjectsSlide {
  type: 'top-projects';
  projects: Array<{ name: string; hours: number; percentage: number }>;
}

export interface BusiestDaySlide {
  type: 'busiest-day';
  date: string;
  dayOfWeek: string;
  hours: number;
  tasks: number;
  topProject: string;
}

export interface StreaksPatternsSlide {
  type: 'streaks-patterns';
  longestStreak: number;
  currentStreak: number;
  mostProductiveDayOfWeek: string;
}

export interface AIInsightSlide {
  type: 'ai-insight';
  insight: string;
  highlights: string[];
  emoji: string;
}

export interface TeamStandingSlide {
  type: 'team-standing';
  rank: number;
  totalMembers: number;
  userHours: number;
  teamAvgHours: number;
  percentile: number;
}

export interface SummarySlide {
  type: 'summary';
  totalHours: number;
  topProject: string;
  daysLogged: number;
  funFact: string;
}

