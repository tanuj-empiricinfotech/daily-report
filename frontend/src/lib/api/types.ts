export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  team_id: number | null;
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
  team_id: number;
  name: string;
  description: string | null;
  created_by: number;
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
  created_at: string;
  updated_at: string;
  projects: Array<{
    id: number;
    name: string;
    description: string | null;
    team_id: number;
    created_by: number;
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
  team_id: number;
  name: string;
  description?: string;
}

export interface CreateLogDto {
  project_id: number;
  date: string;
  task_description: string;
  actual_time_spent: string;
  tracked_time: string;
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

