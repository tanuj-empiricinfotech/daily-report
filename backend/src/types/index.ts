export type UserRole = 'admin' | 'member';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  team_id: number | null;
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

