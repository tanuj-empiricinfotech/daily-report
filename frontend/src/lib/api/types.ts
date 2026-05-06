export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  team_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  webhook_url: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  team_ids: number[];
  name: string;
  description: string | null;
  created_by: number;
  estimated_hours: number | null;
  progress_tracking_enabled: boolean;
  tracked_hours_total: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: number;
  project_id: number;
  user_id: number;
  assigned_at: string;
}

export interface UserWithProjects {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  team_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  projects: Array<{
    id: number;
    name: string;
    description: string | null;
    team_ids: number[];
    created_by: number;
    estimated_hours: number | null;
    progress_tracking_enabled: boolean;
    tracked_hours_total: number;
    created_at: string;
    updated_at: string;
    assigned_at: string;
  }>;
}

export interface UserWithProjectsAndTeam extends UserWithProjects {
  team_name: string | null;
}

export interface DailyLog {
  id: number;
  user_id: number;
  project_id: number;
  date: string;
  task_description: string;
  actual_time_spent: string;
  tracked_time: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'member';
  team_id?: number | null;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  webhook_url?: string;
}

export interface CreateProjectDto {
  team_ids: number[];
  name: string;
  description?: string;
  estimated_hours?: number | null;
  progress_tracking_enabled?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string | null;
  team_ids?: number[];
  estimated_hours?: number | null;
  progress_tracking_enabled?: boolean;
}

export interface FeedbackReceived {
  id: number;
  content: string;
  rating: number | null;
  is_read: boolean;
  created_at: string;
}

export interface FeedbackSent {
  id: number;
  to_user_id: number;
  content: string;
  rating: number | null;
  created_at: string;
}

export interface CreateFeedbackDto {
  to_user_id: number;
  content: string;
  rating?: number | null;
}

export interface CreateLogDto {
  project_id: number;
  date: string;
  task_description: string;
  actual_time_spent: string;
  tracked_time: string;
  user_id?: number; // Optional - for admins to create logs for other users
}

export interface UpdateLogDto {
  project_id?: number;
  date?: string;
  task_description?: string;
  actual_time_spent?: string;
  tracked_time?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContextOptions {
  startDate?: string;
  endDate?: string;
  targetUserId?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: ChatContextOptions;
}

export interface ChatContextMetadata {
  userId: number;
  userName: string;
  logCount: number;
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
}

// Monthly Recap Types
export type RecapSlide =
  | { type: 'welcome'; userName: string; monthName: string; year: number; totalLogs: number }
  | { type: 'total-hours'; totalHours: number; avgHoursPerDay: number; totalDaysLogged: number; comparisonToPrevMonth: number }
  | { type: 'top-projects'; projects: Array<{ name: string; hours: number; percentage: number }> }
  | { type: 'busiest-day'; date: string; dayOfWeek: string; hours: number; tasks: number; topProject: string }
  | { type: 'streaks-patterns'; longestStreak: number; currentStreak: number; mostProductiveDayOfWeek: string }
  | { type: 'ai-insight'; insight: string; highlights: string[]; emoji: string }
  | { type: 'team-standing'; rank: number; totalMembers: number; userHours: number; teamAvgHours: number; percentile: number }
  | { type: 'summary'; totalHours: number; topProject: string; daysLogged: number; funFact: string };

export interface MonthlyRecap {
  id: number;
  user_id: number;
  month: number;
  year: number;
  slides_data: RecapSlide[];
  last_viewed_slide: number;
  is_partial: boolean;
  generated_at: string;
}

export interface AvailableRecapMonth {
  month: number;
  year: number;
  generated: boolean;
}

export interface UserSession {
  id: number;
  device_info: string | null;
  created_at: string;
  is_current: boolean;
}

