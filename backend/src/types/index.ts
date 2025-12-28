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
  date: Date;
  task_description: string;
  actual_time_spent: number;
  tracked_time: number;
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
  actual_time_spent: number;
  tracked_time: number;
}

export interface UpdateLogDto {
  project_id?: number;
  date?: string;
  task_description?: string;
  actual_time_spent?: number;
  tracked_time?: number;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

