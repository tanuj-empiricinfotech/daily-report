const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const endpoints = {
  auth: {
    register: `${API_BASE}/auth/register`,
    login: `${API_BASE}/auth/login`,
    logout: `${API_BASE}/auth/logout`,
  },
  teams: {
    list: `${API_BASE}/teams`,
    create: `${API_BASE}/teams`,
    get: (id: number) => `${API_BASE}/teams/${id}`,
    update: (id: number) => `${API_BASE}/teams/${id}`,
    delete: (id: number) => `${API_BASE}/teams/${id}`,
  },
  projects: {
    list: `${API_BASE}/projects`,
    listByTeam: (teamId: number) => `${API_BASE}/projects/team/${teamId}`,
    create: `${API_BASE}/projects`,
    get: (id: number) => `${API_BASE}/projects/${id}`,
    update: (id: number) => `${API_BASE}/projects/${id}`,
    delete: (id: number) => `${API_BASE}/projects/${id}`,
  },
  users: {
    list: `${API_BASE}/users`,
    getByTeam: (teamId: number) => `${API_BASE}/users/team/${teamId}`,
    create: `${API_BASE}/users`,
    update: (id: number) => `${API_BASE}/users/${id}`,
    delete: (id: number) => `${API_BASE}/users/${id}`,
  },
  assignments: {
    create: `${API_BASE}/assignments`,
    delete: `${API_BASE}/assignments`,
    getUserAssignments: (userId: number) => `${API_BASE}/assignments/user/${userId}`,
    getProjectAssignments: (projectId: number) => `${API_BASE}/assignments/project/${projectId}`,
  },
  logs: {
    create: `${API_BASE}/logs`,
    getMyLogs: `${API_BASE}/logs/my`,
    getTeamLogs: (teamId: number) => `${API_BASE}/logs/team/${teamId}`,
    get: (id: number) => `${API_BASE}/logs/${id}`,
    update: (id: number) => `${API_BASE}/logs/${id}`,
    delete: (id: number) => `${API_BASE}/logs/${id}`,
  },
};

