# Daily Work Logging Platform

A comprehensive daily work logging platform with authentication, project management, team member assignments, and time tracking (actual time vs tracked time) using PostgreSQL, Express.js backend, and React frontend with shadcn/ui.

## Overview

This platform enables teams to track daily work logs with support for multiple teams, projects, and team members. It provides separate interfaces for administrators and team members, with role-based access control and team-scoped data isolation.

## Features

### Authentication & Security
- JWT-based authentication with HTTP-only cookies
- Role-based access control (admin/member)
- Secure password hashing with bcryptjs
- Session management with automatic token handling
- Password change functionality
- Rate limiting for sensitive operations

### Team Management
- Multiple teams support
- Team-based data isolation
- Team member assignments
- Projects scoped to teams
- Microsoft Teams integration for daily summaries

### Admin Features
- **Dashboard**: Analytics overview with KPI metrics, charts, and trends
- **Team Management**: Create, edit, and delete teams
- **Project Management**: Create, edit, and delete projects (team-scoped)
- **User Management**: View team members and assign them to projects
- **Logs Viewer**: View all team logs with advanced filtering (date, user, project, team)
- **Analytics**: Advanced analytics with time series charts, project performance, and team metrics
- **Projects Page**: Detailed project view with time tracking and member assignments
- **Team Page**: Comprehensive team management interface

### Team Member Features
- **Dashboard**: Personal dashboard with time tracking metrics and recent activity
- **Daily Logs**: View and manage daily work logs
- **Project View**: View assigned projects (from their team)
- **Log Creation**: Log daily work with:
  - Project selection (only assigned projects)
  - Task description
  - Actual time spent (decimal hours)
  - Tracked time (decimal hours)
  - Bulk log creation support
- **Log Management**: View and edit own logs for any date
- **Date Filtering**: View logs by date with summary

### Additional Features
- **Theme Support**: Light, dark, and system theme modes
- **Settings Page**: User profile management and preferences
- **Responsive Design**: Modern UI with shadcn/ui components
- **Scheduled Jobs**: Automated daily team summaries sent to Microsoft Teams
- **Error Handling**: Comprehensive error boundaries and error display
- **Data Visualization**: Charts and graphs for analytics (Recharts)

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (Dockerized)
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Scheduling**: node-cron for automated jobs
- **HTTP Client**: axios (for Teams webhooks)
- **Rate Limiting**: express-rate-limit

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: 
  - Redux Toolkit with Redux Persist
  - TanStack Query (React Query) for server state
- **HTTP Client**: Axios (with cookie support)
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Icons**: Tabler Icons React
- **Date Handling**: date-fns
- **Tables**: TanStack Table for advanced data tables

## Architecture

The project follows clean architecture principles with clear separation of concerns:

### Backend Structure
```
backend/
  src/
    index.ts                    # Express server entry point
    db/
      connection.ts            # PostgreSQL connection pool
      migrations/              # Database migration files
      repositories/            # Data access layer (abstraction)
    services/                  # Business logic layer
    controllers/               # Request/response handling
    routes/                    # API route definitions
    middleware/                # Auth, validation, error handling
    validators/                # Input validation schemas
    utils/                     # Utility functions (JWT, errors)
    types/                     # TypeScript type definitions
```

### Frontend Structure
```
frontend/
  src/
    pages/                     # Page components
      - Dashboard.tsx          # Main dashboard (role-based)
      - DailyLog.tsx           # Daily logs page
      - Analytics.tsx          # Advanced analytics (admin)
      - Projects.tsx           # Projects management (admin)
      - ProjectDetails.tsx    # Project details page
      - Team.tsx              # Team management page
      - Settings.tsx          # User settings
      - Login.tsx             # Authentication
    components/
      admin/                  # Admin dashboard components
      auth/                   # Authentication components
      dashboard/              # Dashboard widgets
      layout/                 # Layout components (Navbar, Sidebar, etc.)
      logs/                   # Daily logging components
      ui/                     # Reusable UI components (shadcn/ui)
    store/
      slices/                 # Redux slices (auth, teams, projects)
    lib/
      api/                    # API client and endpoints
      query/                  # TanStack Query hooks
      theme.ts                # Theme configuration
    hooks/                    # Custom React hooks
    contexts/                 # React contexts (ThemeContext)
    utils/                    # Utility functions (date, time, analytics, chart)
```

## Database Schema

### Core Tables

1. **teams** - Multiple teams support
   - `id`, `name`, `description`, `created_by` (user_id), `created_at`, `updated_at`

2. **users** - Team members and admin users
   - `id`, `email`, `password_hash`, `name`, `role` (admin/member), `team_id` (nullable for admins), `created_at`, `updated_at`

3. **team_members** - Links users to teams (many-to-many)
   - `id`, `team_id`, `user_id`, `joined_at`

4. **projects** - Projects that tasks belong to (scoped to teams)
   - `id`, `team_id`, `name`, `description`, `created_by` (user_id), `created_at`, `updated_at`

5. **project_assignments** - Links team members to projects
   - `id`, `project_id`, `user_id`, `assigned_at`

6. **daily_logs** - Daily work entries
   - `id`, `user_id`, `project_id`, `date`, `task_description`, `actual_time_spent` (decimal), `tracked_time` (decimal), `created_at`, `updated_at`

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

### Quick Start (Run Both Servers)

From the root directory, you can run both backend and frontend servers simultaneously:

1. Install all dependencies (root, backend, and frontend):
```bash
npm run install:all
```

2. Start both servers:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Frontend server on `http://localhost:5173` (or next available port)

### Individual Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/daily_report
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

5. Start PostgreSQL using Docker Compose (from project root):
```bash
docker-compose up -d
```

6. Run database migrations:
```bash
npm run db:migrate
```

7. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

## Development Guidelines

### Clean Code Principles

This project follows clean code principles:

- **DRY (Don't Repeat Yourself)**: Reusable components, utilities, and services
- **Abstractions**: Repository pattern, service layer, custom hooks
- **Single Responsibility**: Each file/function has one clear purpose
- **Separation of Concerns**: Clear layers (routes → controllers → services → repositories → database)
- **Type Safety**: TypeScript types throughout
- **Error Handling**: Centralized error handling and validation
- **Configuration**: Environment variables, constants extracted
- **Reusability**: Shared components, hooks, and utilities

### Code Organization

- Use repository pattern for data access
- Business logic in service layer
- Controllers handle request/response
- Reusable components and hooks
- Centralized error handling
- Input validation with express-validator

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Teams (Admin only)
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Projects (Admin only, team-scoped)
- `GET /api/projects` - Get projects (filtered by team)
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Assignments (Admin only)
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Assign user to project
- `DELETE /api/assignments/:id` - Remove assignment

### Users (Admin only, team-scoped)
- `GET /api/users` - Get users (filtered by team)
- `GET /api/users/:id` - Get user by ID

### Logs
- `GET /api/logs` - Get logs (members: own logs, admin: all team logs)
- `POST /api/logs` - Create log entry
- `POST /api/logs/bulk` - Create multiple log entries
- `GET /api/logs/:id` - Get log by ID
- `PUT /api/logs/:id` - Update log entry
- `DELETE /api/logs/:id` - Delete log entry
- `GET /api/logs/team/:teamId` - Get team logs (admin only, with filters)

### Authentication (Additional)
- `POST /api/auth/change-password` - Change user password (authenticated)

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/daily_report
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
TEAMS_WEBHOOK_URL=your-teams-webhook-url (optional, for daily summaries)
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## Scripts

### Root Level (from project root)
- `npm run dev` - Start both backend and frontend development servers concurrently
- `npm run dev:backend` - Start only backend development server
- `npm run dev:frontend` - Start only frontend development server
- `npm run build` - Build both backend and frontend for production
- `npm run build:backend` - Build only backend for production
- `npm run build:frontend` - Build only frontend for production
- `npm run install:all` - Install dependencies for root, backend, and frontend
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (drop and recreate)

### Backend (from backend directory)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

### Frontend (from frontend directory)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

ISC

