# TODO - Daily Work Logging Platform

This file tracks the implementation progress for the Daily Work Logging Platform.

## Status Legend
- ⏳ Pending
- 🔄 In Progress
- ✅ Completed
- ❌ Cancelled

---

## Phase 1: Infrastructure & Database

### ⏳ Docker Setup
**ID**: `docker-setup`  
**Status**: Pending  
**Description**: Set up Docker: Create docker-compose.yml for PostgreSQL, configure database connection, create .env.example

**Tasks**:
- [ ] Create `docker-compose.yml` at root with PostgreSQL service
- [ ] Create `backend/.env.example` with environment variables template
- [ ] Set up database initialization scripts if needed
- [ ] Document Docker setup in README

---

### ⏳ Database Schema
**ID**: `database-schema`  
**Status**: Pending  
**Dependencies**: `docker-setup`  
**Description**: Create PostgreSQL database schema: teams, users, team_members, projects, project_assignments, daily_logs tables. Create migration files

**Tasks**:
- [ ] Create `backend/src/db/migrations/init.sql` with schema
- [ ] Create `teams` table
- [ ] Create `users` table
- [ ] Create `team_members` table
- [ ] Create `projects` table
- [ ] Create `project_assignments` table
- [ ] Create `daily_logs` table
- [ ] Add indexes for performance
- [ ] Add foreign key constraints
- [ ] Test migration execution

---

## Phase 2: Backend Foundation

### ⏳ Backend Setup
**ID**: `backend-setup`  
**Status**: Pending  
**Description**: Set up backend project structure: add dependencies (pg, bcryptjs, jsonwebtoken, cookie-parser, cors, dotenv, express-validator), create clean architecture folders (repositories, services, controllers), create index.ts server file

**Tasks**:
- [ ] Install dependencies: `pg`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `dotenv`, `express-validator`
- [ ] Create folder structure: `src/db/`, `src/services/`, `src/controllers/`, `src/routes/`, `src/middleware/`, `src/validators/`, `src/utils/`, `src/types/`
- [ ] Create `backend/src/index.ts` - Express server entry point
- [ ] Configure CORS with credentials support
- [ ] Set up cookie parser middleware
- [ ] Configure environment variables
- [ ] Add development scripts to package.json

---

### ⏳ Backend Repositories
**ID**: `backend-repositories`  
**Status**: Pending  
**Dependencies**: `backend-setup`, `database-schema`  
**Description**: Create repository layer: Base repository with common CRUD, teams, users, projects, assignments, logs repositories following clean code principles

**Tasks**:
- [ ] Create `backend/src/db/connection.ts` - PostgreSQL connection pool
- [ ] Create `backend/src/db/repositories/base.repository.ts` - Base repository with common CRUD operations
- [ ] Create `backend/src/db/repositories/teams.repository.ts` - Team data access
- [ ] Create `backend/src/db/repositories/users.repository.ts` - User data access
- [ ] Create `backend/src/db/repositories/projects.repository.ts` - Project data access
- [ ] Create `backend/src/db/repositories/assignments.repository.ts` - Assignment data access
- [ ] Create `backend/src/db/repositories/logs.repository.ts` - Log data access
- [ ] Add error handling to repositories
- [ ] Add TypeScript types for repository methods

---

### ⏳ Backend Services
**ID**: `backend-services`  
**Status**: Pending  
**Dependencies**: `backend-repositories`  
**Description**: Create service layer: Auth, teams, projects, assignments, logs services with business logic abstraction

**Tasks**:
- [ ] Create `backend/src/services/auth.service.ts` - Authentication business logic
- [ ] Create `backend/src/services/teams.service.ts` - Team business logic
- [ ] Create `backend/src/services/projects.service.ts` - Project business logic
- [ ] Create `backend/src/services/assignments.service.ts` - Assignment business logic
- [ ] Create `backend/src/services/logs.service.ts` - Log business logic
- [ ] Implement business rules and validations
- [ ] Add error handling in services

---

### ⏳ Backend Auth
**ID**: `backend-auth`  
**Status**: Pending  
**Dependencies**: `backend-services`  
**Description**: Implement authentication: JWT with HTTP-only cookies, auth service, login/register/logout routes, password hashing, auth middleware

**Tasks**:
- [ ] Create `backend/src/utils/jwt.ts` - JWT utility functions
- [ ] Implement password hashing with bcryptjs in auth service
- [ ] Create `backend/src/middleware/auth.ts` - JWT verification middleware (reads from HTTP-only cookies)
- [ ] Create `backend/src/routes/auth.ts` - Login, register, logout endpoints
- [ ] Set JWT token in HTTP-only cookie on login
- [ ] Clear cookie on logout
- [ ] Configure cookie settings: httpOnly, secure (production), sameSite
- [ ] Create `backend/src/validators/auth.validator.ts` - Auth validation schemas
- [ ] Test authentication flow

---

### ⏳ Backend Controllers & Routes
**ID**: `backend-controllers-routes`  
**Status**: Pending  
**Dependencies**: `backend-auth`  
**Description**: Create controllers and API routes: Teams, projects, assignments, users, logs with validation middleware and error handling

**Tasks**:
- [ ] Create `backend/src/controllers/teams.controller.ts` - Team request handlers
- [ ] Create `backend/src/controllers/projects.controller.ts` - Project request handlers
- [ ] Create `backend/src/controllers/assignments.controller.ts` - Assignment request handlers
- [ ] Create `backend/src/controllers/logs.controller.ts` - Log request handlers
- [ ] Create `backend/src/controllers/auth.controller.ts` - Auth request handlers
- [ ] Create `backend/src/routes/teams.ts` - Team routes (admin only)
- [ ] Create `backend/src/routes/projects.ts` - Project routes (admin only, team-scoped)
- [ ] Create `backend/src/routes/assignments.ts` - Assignment routes (admin only)
- [ ] Create `backend/src/routes/users.ts` - User routes (admin only, team-scoped)
- [ ] Create `backend/src/routes/logs.ts` - Log routes (members can create/edit own, admin can view all)
- [ ] Create `backend/src/routes/index.ts` - Route aggregator
- [ ] Create `backend/src/middleware/validation.ts` - Request validation middleware
- [ ] Create `backend/src/middleware/errorHandler.ts` - Global error handler middleware
- [ ] Create `backend/src/validators/project.validator.ts` - Project validation
- [ ] Create `backend/src/validators/log.validator.ts` - Log validation (time values as decimals)
- [ ] Create `backend/src/utils/errors.ts` - Error handling utilities
- [ ] Add input validation for time values (decimal format, positive numbers)
- [ ] Test all API endpoints

---

## Phase 3: Frontend Foundation

### ⏳ Frontend Setup
**ID**: `frontend-setup`  
**Status**: Pending  
**Description**: Set up frontend: Add dependencies (TanStack Query, Redux Toolkit, axios, react-router-dom), configure Redux store, TanStack Query client, axios instance with cookie support

**Tasks**:
- [ ] Install dependencies: `@tanstack/react-query`, `@reduxjs/toolkit`, `react-redux`, `axios`, `react-router-dom`, `date-fns`
- [ ] Create `frontend/src/store/store.ts` - Redux store configuration
- [ ] Create `frontend/src/store/slices/` folder structure
- [ ] Create `frontend/src/lib/query/queryClient.ts` - TanStack Query client configuration
- [ ] Create `frontend/src/lib/api/client.ts` - Axios instance with interceptors (handles cookies automatically)
- [ ] Configure `withCredentials: true` for axios
- [ ] Set up environment variables for API URL
- [ ] Update `frontend/src/App.tsx` with QueryClientProvider and Redux Provider

---

### ⏳ Frontend API Client
**ID**: `frontend-api-client`  
**Status**: Pending  
**Dependencies**: `frontend-setup`  
**Description**: Set up frontend API client: Axios instance with interceptors, API endpoints constants, TypeScript types, query hooks structure

**Tasks**:
- [ ] Create `frontend/src/lib/api/endpoints.ts` - API endpoint constants
- [ ] Create `frontend/src/lib/api/types.ts` - API response types
- [ ] Configure axios interceptors for error handling
- [ ] Create `frontend/src/lib/query/hooks/` folder structure
- [ ] Add TypeScript types for API requests and responses

---

### ⏳ Frontend Auth
**ID**: `frontend-auth`  
**Status**: Pending  
**Dependencies**: `frontend-api-client`, `backend-auth`  
**Description**: Implement frontend authentication: Login page, Redux auth slice, TanStack Query auth hooks, ProtectedRoute component, cookie-based token handling

**Tasks**:
- [ ] Create `frontend/src/pages/Login.tsx` - Login page
- [ ] Create `frontend/src/store/slices/authSlice.ts` - Auth state in Redux
- [ ] Create `frontend/src/lib/query/hooks/useAuth.ts` - Auth mutations/queries with TanStack Query
- [ ] Create `frontend/src/components/ProtectedRoute.tsx` - Route protection
- [ ] Create `frontend/src/hooks/useAuth.ts` - Custom hook for auth state (abstraction layer)
- [ ] Test cookie-based token handling
- [ ] Implement automatic token refresh handling

---

## Phase 4: Admin Dashboard

### ✅ Admin Dashboard
**ID**: `admin-dashboard`  
**Status**: Completed  
**Dependencies**: `frontend-auth`, `backend-controllers-routes`  
**Description**: Build admin dashboard: Redux slices for teams/projects, TanStack Query hooks, TeamManager, ProjectManager, UserManager, LogsViewer components with CRUD operations

**Tasks**:
- [x] Create `frontend/src/pages/AdminDashboard.tsx` - Main admin interface
- [x] Create `frontend/src/store/slices/teamsSlice.ts` - Teams state management
- [x] Create `frontend/src/store/slices/projectsSlice.ts` - Projects state management
- [x] Create `frontend/src/lib/query/hooks/useTeams.ts` - Team queries/mutations
- [x] Create `frontend/src/lib/query/hooks/useProjects.ts` - Project queries/mutations
- [x] Create `frontend/src/lib/query/hooks/useUsers.ts` - User queries/mutations
- [x] Create `frontend/src/components/admin/TeamManager.tsx` - Create/manage teams
- [x] Create `frontend/src/components/admin/ProjectManager.tsx` - Create/edit/delete projects (team-scoped)
- [x] Create `frontend/src/components/admin/UserManager.tsx` - View team members and assign to projects
- [x] Create `frontend/src/components/admin/LogsViewer.tsx` - View all team logs with filters (team-scoped)
- [x] Implement CRUD operations for teams
- [x] Implement CRUD operations for projects
- [x] Implement user assignment to projects
- [x] Implement log filtering and viewing
- [x] Enhance admin components with modern shadcn UI components (AlertDialog, Badge)
- [x] Fix UserManager to properly display user assignments using API

---

## Phase 5: Daily Logging Interface

### ⏳ Daily Logging
**ID**: `daily-logging`  
**Status**: Pending  
**Dependencies**: `frontend-auth`, `backend-controllers-routes`  
**Description**: Build daily logging interface: TanStack Query hooks for logs, LogForm with reusable TimeInput component, LogList, ProjectSelector, date picker, time utilities

**Tasks**:
- [ ] Create `frontend/src/pages/DailyLog.tsx` - Main logging page for team members
- [ ] Create `frontend/src/store/slices/logsSlice.ts` - Logs state management (optional, TanStack Query may be sufficient)
- [ ] Create `frontend/src/lib/query/hooks/useLogs.ts` - Log queries/mutations
- [ ] Create `frontend/src/lib/query/hooks/useAssignments.ts` - Assignment queries (for project selector)
- [ ] Create `frontend/src/components/logs/LogForm.tsx` - Form to add/edit log entries (reusable, abstracted)
- [ ] Create `frontend/src/components/logs/LogList.tsx` - Display user's logs for selected date
- [ ] Create `frontend/src/components/logs/ProjectSelector.tsx` - Select from assigned projects (reusable component)
- [ ] Create `frontend/src/components/logs/TimeInput.tsx` - Reusable time input component for decimal hours
- [ ] Create `frontend/src/utils/time.ts` - Time conversion utilities (DRY)
- [ ] Create `frontend/src/components/ui/DatePicker.tsx` - Reusable date picker component
- [ ] Implement time input validation (decimal format, positive numbers)
- [ ] Implement log creation and editing
- [ ] Implement log viewing by date

---

## Phase 6: Navigation & Layout

### ⏳ Routing & Layout
**ID**: `routing-layout`  
**Status**: Pending  
**Dependencies**: `admin-dashboard`, `daily-logging`  
**Description**: Set up React Router with QueryClientProvider and Redux Provider, create Navbar and AppLayout components, configure routes for admin and member views

**Tasks**:
- [ ] Create `frontend/src/components/layout/Navbar.tsx` - Navigation with logout and team selector
- [ ] Create `frontend/src/components/layout/Sidebar.tsx` - Sidebar navigation (if needed)
- [ ] Create `frontend/src/components/layout/AppLayout.tsx` - Main layout wrapper (reusable)
- [ ] Update `frontend/src/App.tsx` - Set up routing with React Router
- [ ] Configure routes for admin dashboard
- [ ] Configure routes for daily logging
- [ ] Configure routes for login page
- [ ] Add route protection based on user role
- [ ] Test navigation flow

---

## Phase 7: UI Components & Utilities

### Additional UI Components
**Status**: Pending  
**Description**: Create reusable UI components and utilities

**Tasks**:
- [ ] Create `frontend/src/components/ui/LoadingSpinner.tsx` - Reusable loading component
- [ ] Create `frontend/src/components/ui/ErrorDisplay.tsx` - Reusable error display component
- [ ] Create `frontend/src/hooks/useDebounce.ts` - Debounce hook for search/filtering
- [ ] Create `frontend/src/utils/formatting.ts` - Formatting utilities (dates, time, etc.)
- [ ] Add loading states using TanStack Query's isLoading/isFetching
- [ ] Add error handling using TanStack Query's error states
- [ ] Ensure all components use existing shadcn/ui components (Card, Input, Button, Select, etc.)

---

## Notes

- All time values are stored as decimal hours (e.g., 1.5 hours = 1.5)
- Projects are scoped to teams - admins can only manage projects within their team
- Team members can only log time for projects they are assigned to
- Admins can view all logs within their team
- Team members can only view and edit their own logs
- All API endpoints require authentication except login/register
- JWT tokens are stored in HTTP-only cookies for security

---

## Progress Summary

- **Total Tasks**: 13 main todos
- **Completed**: 1 (Admin Dashboard)
- **In Progress**: 0
- **Pending**: 12

Last updated: [Auto-updated on completion]

