# Daily Work Logging Platform - Project Overview

## What is This Project?

The **Daily Work Logging Platform** is a comprehensive web application designed for teams to track and manage daily work logs. It provides a structured system for employees to log their work activities, track time spent on projects, and enables administrators to manage teams, projects, and monitor team productivity.

### Core Purpose

The platform solves the problem of tracking daily work activities across multiple teams and projects. It enables:
- **Team Members**: To log their daily work with task descriptions, actual time spent, and tracked time for assigned projects
- **Administrators**: To manage teams, create projects, assign team members to projects, and view comprehensive logs across their teams

---

## Key Features

### 1. **Authentication & Authorization**
- JWT-based authentication with HTTP-only cookies for secure token storage
- Role-based access control (Admin/Member)
- Secure password hashing using bcryptjs
- Automatic session management with token validation
- Protected routes based on user roles

### 2. **Team Management**
- Support for multiple teams within the organization
- Team-based data isolation (users, projects, logs are scoped to teams)
- Many-to-many relationship between users and teams
- Team creation and management by administrators

### 3. **Project Management**
- Projects are scoped to teams (team-specific projects)
- Project creation, editing, and deletion by administrators
- Project assignment system linking team members to specific projects
- Team members can only log time for projects they are assigned to

### 4. **Daily Work Logging**
- Log daily work activities with:
  - **Project Selection**: Only assigned projects are available
  - **Task Description**: Detailed description of work performed
  - **Actual Time Spent**: Decimal hours (e.g., 1.5 hours)
  - **Tracked Time**: Decimal hours for time tracking systems
- Bulk log creation (multiple entries at once)
- Date-based log viewing and filtering
- Edit and delete own logs (members) or any team logs (admins)

### 5. **Admin Dashboard**
- **Team Management**: Create, view, edit, and delete teams
- **Project Management**: Create, edit, and delete projects within selected teams
- **User Management**: View team members and their project assignments
- **Logs Viewer**: View all team logs with advanced filtering (by date, user, project, team)
- Team selector for scoped operations

### 6. **Member Dashboard**
- View assigned projects
- Create new log entries
- View and filter own logs by date range and project
- Edit and delete own log entries
- Date range picker for log filtering
- Personal analytics with time tracking metrics

### 7. **Analytics & Reporting**
- **Dashboard**: Role-based dashboard with KPI metrics (total hours, projects, trends)
- **Advanced Analytics**: Admin-only analytics page with:
  - Time series charts showing work patterns over time
  - Top projects by hours logged
  - Team performance metrics
  - Recent activity feed
  - Customizable date ranges (7d, 30d, 90d, 180d, 365d)
- **Project Details**: Detailed project view with time tracking and member assignments
- **Data Visualization**: Interactive charts using Recharts

### 8. **Microsoft Teams Integration**
- Automated daily summary reports sent to Microsoft Teams channels
- Scheduled cron job runs daily at 8:30 PM IST
- Team-based summaries with project breakdowns
- Configurable webhook URLs per team
- Summary includes total hours, project distribution, and member contributions

### 9. **Theme & UI Enhancements**
- **Theme Support**: Light, dark, and system theme modes
- **Settings Page**: User profile management, password change, theme preferences
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **Responsive Design**: Mobile-friendly layout with sidebar navigation
- **Error Boundaries**: Graceful error handling with React error boundaries

---

## Architecture Overview

The project follows **Clean Architecture** principles with clear separation of concerns across multiple layers.

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
│                  (index.ts - Entry Point)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      Routes Layer                        │
│  (auth, teams, projects, assignments, users, logs)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Middleware Layer                       │
│  (Authentication, Validation, Error Handling)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Controllers Layer                      │
│  (Request/Response Handling, Input Transformation)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Services Layer                        │
│  (Business Logic, Validation, Authorization Checks)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Repositories Layer                      │
│  (Data Access Abstraction, SQL Queries)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  (Connection Pool via pg library)                        │
└─────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React App (App.tsx)                   │
│  (React Router, Redux Provider, QueryClient Provider)   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐        ┌──────────────────┐
│  Pages Layer  │        │  Components Layer │
│  (Routes)     │        │  (UI Components)  │
└───────┬───────┘        └────────┬──────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
        ┌────────────────────────┐
        │   State Management     │
        │  (Redux + TanStack)    │
        └────────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐        ┌──────────────────┐
│  Redux Store  │        │  TanStack Query  │
│  (Auth, Teams)│        │  (API Hooks)     │
└───────────────┘        └────────┬──────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │   API Client     │
                        │  (Axios + Cookies)│
                        └────────┬──────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Backend API    │
                        │  (Express.js)   │
                        └─────────────────┘
```

---

## How It Works

### 1. **Authentication Flow**

```
User Login
    │
    ▼
Frontend sends credentials to /api/auth/login
    │
    ▼
Backend validates credentials (AuthService)
    │
    ▼
Backend generates JWT token
    │
    ▼
Token stored in HTTP-only cookie (secure, httpOnly, sameSite)
    │
    ▼
Cookie automatically sent with subsequent requests
    │
    ▼
Auth middleware validates token on protected routes
    │
    ▼
User can access protected resources
```

**Key Security Features:**
- Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Automatic cookie handling by browser
- Token validation on every protected route
- Role-based access control (admin vs member)

### 2. **Data Flow: Creating a Log Entry**

```
Member clicks "New Log"
    │
    ▼
Frontend: CreateLogPage component
    │
    ▼
User fills form (project, task, actual time, tracked time)
    │
    ▼
Frontend: useCreateLog mutation (TanStack Query)
    │
    ▼
API Client: POST /api/logs (with cookie)
    │
    ▼
Backend: LogsController.create()
    │
    ▼
Backend: LogsService.createLog()
    │
    ├─ Validates user is assigned to project
    ├─ Validates time values are positive
    └─ Converts IST date to ISO for storage
    │
    ▼
Backend: LogsRepository.create()
    │
    ▼
Database: INSERT into daily_logs
    │
    ▼
Response returned to frontend
    │
    ▼
TanStack Query updates cache
    │
    ▼
UI updates automatically
```

### 3. **Team-Scoped Data Isolation**

```
Admin selects Team A
    │
    ▼
Redux: setSelectedTeam(teamA.id)
    │
    ▼
All subsequent operations scoped to Team A:
    ├─ Projects: Only Team A projects shown
    ├─ Users: Only Team A members shown
    ├─ Logs: Only Team A logs shown
    └─ Assignments: Only Team A assignments
    │
    ▼
Backend validates team membership on every request
    │
    ▼
Database queries filtered by team_id
```

### 4. **Project Assignment Flow**

```
Admin assigns User to Project
    │
    ▼
Frontend: useCreateAssignment mutation
    │
    ▼
API: POST /api/assignments
    │
    ▼
Backend: AssignmentsService.createAssignment()
    │
    ├─ Validates user belongs to project's team
    ├─ Validates project exists
    └─ Checks for duplicate assignment
    │
    ▼
Backend: AssignmentsRepository.create()
    │
    ▼
Database: INSERT into project_assignments
    │
    ▼
User can now log time for this project
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (Dockerized)
- **Authentication**: JWT (jsonwebtoken) with HTTP-only cookies
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Database Client**: pg (PostgreSQL client)
- **Environment**: dotenv
- **Scheduling**: node-cron for automated jobs
- **HTTP Client**: axios (for Teams webhooks)
- **Rate Limiting**: express-rate-limit

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: 
  - Redux Toolkit with Redux Persist (for auth, teams, projects state)
  - TanStack Query (React Query) for server state
- **HTTP Client**: Axios (with cookie support)
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Icons**: Tabler Icons React
- **Date Handling**: date-fns and custom utilities for IST/ISO conversion
- **Tables**: TanStack Table for advanced data tables
- **Theme**: Custom theme context with system preference detection

### Infrastructure
- **Database**: Docker Compose with PostgreSQL
- **Development**: Concurrently for running both servers
- **Package Management**: npm
- **Jobs**: Automated cron jobs for scheduled tasks

---

## Database Schema

### Core Tables

1. **teams**
   - Stores team information
   - Fields: `id`, `name`, `description`, `created_by`, `created_at`, `updated_at`

2. **users**
   - Stores user accounts (both admins and members)
   - Fields: `id`, `email`, `password_hash`, `name`, `role` (admin/member), `team_id`, `created_at`, `updated_at`
   - Admins can have `team_id` as NULL

3. **team_members**
   - Many-to-many relationship between users and teams
   - Fields: `id`, `team_id`, `user_id`, `joined_at`
   - Allows users to belong to multiple teams

4. **projects**
   - Projects scoped to teams
   - Fields: `id`, `team_id`, `name`, `description`, `created_by`, `created_at`, `updated_at`

5. **project_assignments**
   - Links team members to projects (many-to-many)
   - Fields: `id`, `project_id`, `user_id`, `assigned_at`
   - Determines which projects a user can log time for

6. **daily_logs**
   - Daily work log entries
   - Fields: `id`, `user_id`, `project_id`, `date`, `task_description`, `actual_time_spent` (decimal), `tracked_time` (decimal), `created_at`, `updated_at`

### Relationships

```
teams (1) ──< (many) team_members (many) >── (1) users
teams (1) ──< (many) projects
projects (1) ──< (many) project_assignments (many) >── (1) users
users (1) ──< (many) daily_logs
projects (1) ──< (many) daily_logs
```

---

## API Structure

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (sets HTTP-only cookie)
- `POST /api/auth/logout` - Logout user (clears cookie)

### Teams Endpoints (Admin Only)
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Projects Endpoints (Admin Only, Team-Scoped)
- `GET /api/projects` - Get projects (filtered by team if selected)
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Assignments Endpoints (Admin Only)
- `GET /api/assignments` - Get assignments (filtered by team/project/user)
- `POST /api/assignments` - Assign user to project
- `DELETE /api/assignments/:id` - Remove assignment

### Users Endpoints (Admin Only, Team-Scoped)
- `GET /api/users` - Get users (filtered by team)
- `GET /api/users/:id` - Get user by ID

### Logs Endpoints
- `GET /api/logs` - Get logs (members: own logs, admin: team logs)
- `POST /api/logs` - Create log entry
- `POST /api/logs/bulk` - Create multiple log entries
- `GET /api/logs/:id` - Get log by ID
- `PUT /api/logs/:id` - Update log entry
- `DELETE /api/logs/:id` - Delete log entry
- `GET /api/logs/team/:teamId` - Get team logs (admin only, with filters)

### Authentication Endpoints (Additional)
- `POST /api/auth/change-password` - Change user password (authenticated, rate-limited)

---

## Key Components & Responsibilities

### Backend Components

#### **Repositories** (`backend/src/db/repositories/`)
- **BaseRepository**: Abstract base class with common CRUD operations
- **TeamsRepository**: Team data access
- **UsersRepository**: User data access
- **ProjectsRepository**: Project data access
- **AssignmentsRepository**: Assignment data access
- **LogsRepository**: Log data access

**Responsibility**: Abstract database operations, provide type-safe data access layer

#### **Services** (`backend/src/services/`)
- **AuthService**: Authentication logic, password hashing, token generation
- **TeamsService**: Team business logic, validation
- **ProjectsService**: Project business logic, team scoping
- **AssignmentsService**: Assignment logic, validation
- **LogsService**: Log business logic, authorization checks, validation
- **TeamsSummaryService**: Generates daily team summaries with project breakdowns
- **TeamsNotificationService**: Sends summaries to Microsoft Teams webhooks

**Responsibility**: Business logic, validation, authorization rules

#### **Jobs** (`backend/src/jobs/`)
- **TeamsDailySummaryJob**: Cron job that runs daily at 8:30 PM IST to send team summaries
- **initializeJobs()**: Initializes all scheduled jobs on server startup

**Responsibility**: Scheduled task execution, automated notifications

#### **Controllers** (`backend/src/controllers/`)
- Handle HTTP requests and responses
- Transform data (e.g., IST to ISO date conversion)
- Call appropriate services
- Handle errors

**Responsibility**: Request/response handling, data transformation

#### **Middleware** (`backend/src/middleware/`)
- **auth.ts**: JWT token verification, role checking
- **validation.ts**: Request validation using express-validator
- **errorHandler.ts**: Global error handling

**Responsibility**: Authentication, validation, error handling

### Frontend Components

#### **Pages** (`frontend/src/pages/`)
- **Login.tsx**: Authentication page with register/login toggle
- **Dashboard.tsx**: Role-based dashboard with KPI metrics and charts
- **AdminDashboard.tsx**: Main admin interface with tabs (legacy, redirects to Dashboard)
- **DailyLog.tsx**: Member's log viewing page with date filtering
- **CreateLogPage.tsx**: Create new log entry (single or bulk)
- **EditLogPage.tsx**: Edit existing log entry
- **Analytics.tsx**: Advanced analytics page (admin only) with charts and metrics
- **Projects.tsx**: Projects management page (admin only)
- **ProjectDetails.tsx**: Detailed project view with time tracking
- **Team.tsx**: Team management page (admin only)
- **Settings.tsx**: User settings and preferences

#### **Admin Components** (`frontend/src/components/admin/`)
- **TeamManager.tsx**: CRUD operations for teams
- **ProjectManager.tsx**: CRUD operations for projects
- **UserManager.tsx**: View users and manage assignments
- **LogsViewer.tsx**: View and filter team logs

#### **Log Components** (`frontend/src/components/logs/`)
- **LogForm.tsx**: Reusable form for creating/editing logs
- **LogList.tsx**: Display list of logs
- **LogsDataTable.tsx**: Advanced data table with sorting/filtering
- **MultiRowLogForm.tsx**: Form for creating multiple log entries
- **ProjectSelector.tsx**: Select from assigned projects

#### **State Management**
- **Redux Slices**: `authSlice.ts`, `teamsSlice.ts`, `projectsSlice.ts`
- **Redux Persist**: Persists auth and teams state to localStorage
- **TanStack Query Hooks**: Custom hooks for API calls with caching
- **Custom Hooks**: `useAuth.ts`, `useDebounce.ts`, `use-mobile.ts`
- **Contexts**: `ThemeContext.tsx` for theme management

#### **Dashboard Components** (`frontend/src/components/dashboard/`)
- **MetricCard.tsx**: Reusable metric card component with trend indicators
- **TimeSeriesChart.tsx**: Time series chart for work patterns
- **TopProjects.tsx**: Top projects by hours chart
- **TeamPerformance.tsx**: Team performance metrics chart
- **RecentActivity.tsx**: Recent activity feed component

---

## Security Features

1. **JWT Authentication**
   - Tokens stored in HTTP-only cookies (XSS protection)
   - Automatic token validation on protected routes
   - Token expiration handling

2. **Password Security**
   - bcryptjs hashing with salt rounds
   - Passwords never stored in plain text

3. **Authorization**
   - Role-based access control (admin vs member)
   - Team-scoped data access
   - Users can only access their own data (unless admin)
   - Project assignment validation before logging

4. **Input Validation**
   - express-validator for request validation
   - Type checking and sanitization
   - Time value validation (positive decimals)

5. **CORS Configuration**
   - Configured for specific origins
   - Supports localhost and ngrok URLs
   - Credentials enabled for cookie support

---

## Date/Time Handling

The system handles timezone conversion between IST (Indian Standard Time) and ISO format:

- **Frontend**: Displays dates in IST format
- **Backend**: Stores dates in ISO format (UTC)
- **Conversion**: Automatic conversion on API boundaries
- **Time Values**: Stored as decimal hours (e.g., 1.5 = 1 hour 30 minutes)

**Utilities:**
- `backend/src/utils/date.ts`: IST ↔ ISO conversion
- `frontend/src/utils/date.ts`: IST ↔ ISO conversion
- `frontend/src/utils/time.ts`: Time formatting utilities

---

## Development Workflow

### Running the Application

1. **Start Database**:
   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Start Both Servers**:
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

### Code Organization Principles

1. **DRY (Don't Repeat Yourself)**: Reusable components, utilities, services
2. **Separation of Concerns**: Clear layers (routes → controllers → services → repositories)
3. **Single Responsibility**: Each component has one clear purpose
4. **Type Safety**: TypeScript throughout
5. **Abstraction**: Repository pattern, service layer, custom hooks
6. **Error Handling**: Centralized error handling
7. **Configuration**: Environment variables, constants extracted

---

## Recent Enhancements

### Completed Features
- ✅ **Dashboard**: Role-based dashboard with KPI metrics and charts
- ✅ **Analytics Page**: Advanced analytics with time series charts and team metrics
- ✅ **Projects Page**: Comprehensive project management interface
- ✅ **Project Details**: Detailed project view with time tracking
- ✅ **Team Page**: Enhanced team management interface
- ✅ **Settings Page**: User profile and preferences management
- ✅ **Theme Support**: Light, dark, and system theme modes
- ✅ **Microsoft Teams Integration**: Automated daily summaries
- ✅ **Scheduled Jobs**: Cron jobs for automated tasks
- ✅ **Error Boundaries**: React error boundaries for graceful error handling
- ✅ **Password Management**: Change password functionality
- ✅ **Bulk Log Creation**: Support for creating multiple log entries at once
- ✅ **Advanced Data Tables**: TanStack Table integration with sorting and filtering
- ✅ **Data Visualization**: Recharts integration for analytics

## Future Enhancements

- Enhanced UI components and utilities
- Additional validation and error handling
- Performance optimizations
- Testing infrastructure (unit tests, integration tests)
- Documentation improvements
- Export functionality (CSV, PDF reports)
- Email notifications
- Mobile app support

---

## Summary

The Daily Work Logging Platform is a full-stack application that provides a comprehensive solution for tracking daily work activities across teams and projects. It follows clean architecture principles, implements robust security measures, and provides a modern, responsive user interface. The system is designed to scale with multiple teams, projects, and users while maintaining data isolation and security.

**Key Strengths:**
- Clean architecture with clear separation of concerns
- Secure authentication and authorization
- Team-based data isolation
- Modern tech stack with TypeScript
- Reusable components and utilities
- Comprehensive error handling
- Type-safe throughout

The platform successfully enables teams to track work, manage projects, and monitor productivity while maintaining security and data integrity.
