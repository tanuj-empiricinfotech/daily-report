# Daily Work Logging Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](#contributing)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/tanuj-empiricinfotech/daily-report)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green.svg)](https://daily-report-omega.vercel.app)

A comprehensive daily work logging platform with authentication, project management, team member assignments, and time tracking (actual time vs tracked time) using PostgreSQL, Express.js backend, and React frontend with shadcn/ui.

> **Note**: This project is open source and welcomes contributions! See our [Contributing Guidelines](#contributing) to get started.
>
> **🔗 Links**: 
> - **Repository**: [GitHub](https://github.com/tanuj-empiricinfotech/daily-report)
> - **Live Demo**: [daily-report-omega.vercel.app](https://daily-report-omega.vercel.app)

## Overview

This platform enables teams to track daily work logs with support for multiple teams, projects, and team members. It provides separate interfaces for administrators and team members, with role-based access control and team-scoped data isolation.

## Vision

### For Administrators
Empower team leaders and project managers with comprehensive insights into how their teams spend time. The platform helps organize projects, track hours effectively, and make data-driven decisions about resource allocation and project planning.

**Future Enhancements:**
- **AI Analytics & Summarization**: Leverage artificial intelligence to analyze project data and automatically generate case studies, project summaries, and insights
- **Predictive Analytics**: Forecast project timelines and resource needs based on historical data
- **Automated Reporting**: Generate comprehensive reports and presentations with AI assistance

### For Developers
Provide developers with personal insights into their work patterns, helping them understand where they spend their time over weeks, months, and years. This visibility enables better time management and professional growth tracking.

**Future Enhancements:**
- **AI-Powered Analysis**: Use AI to analyze work patterns and provide personalized insights
- **Yearly Wrap**: Automatically generate year-end summaries highlighting achievements, skills developed, and projects completed
- **Resume Assistance**: AI-powered tools to help write experience sections, professional summaries, and project descriptions for resumes
- **Career Insights**: Get recommendations on skill development and career growth based on logged work patterns

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

## Roadmap

We're continuously working on improving the platform. Here's what's coming next:

### 🎯 Phase 1: Enhanced Analytics (Current)
- ✅ Time tracking and basic analytics
- ✅ Team and project insights
- ✅ Microsoft Teams integration

### 🤖 Phase 2: AI-Powered Features (Planned)

#### For Administrators
- **AI Analytics & Summarization**: Automatically analyze project data and generate comprehensive case studies
- **Project Insights**: AI-driven recommendations for project optimization and resource allocation
- **Automated Reporting**: Generate executive summaries and presentations with AI assistance
- **Predictive Analytics**: Forecast project timelines and identify potential bottlenecks

#### For Developers
- **AI-Powered Yearly Wrap**: Automatically generate year-end summaries highlighting achievements, skills, and growth
- **Resume Builder**: AI assistance for writing experience sections, professional summaries, and project descriptions
- **Career Insights**: Personalized recommendations for skill development based on logged work patterns
- **Work Pattern Analysis**: Deep insights into productivity patterns, time allocation, and skill development over time

### 🚀 Phase 3: Advanced Features (Future)
- Export capabilities (PDF, CSV, Excel)
- Mobile applications
- Advanced integrations (Slack, Jira, etc.)
- Customizable dashboards and reports
- Team collaboration features

**Contributions welcome!** If you're interested in helping build any of these features, check out our [Contributing Guidelines](#contributing).

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

## Support

Need help? Here are some ways to get support:

- **Documentation**: Check this README and the codebase documentation
- **Issues**: Search existing [GitHub Issues](https://github.com/tanuj-empiricinfotech/daily-report/issues) for similar problems
- **Report Bugs**: [Open a new issue](https://github.com/tanuj-empiricinfotech/daily-report/issues/new) with detailed information about the problem
- **Feature Requests**: [Open an issue](https://github.com/tanuj-empiricinfotech/daily-report/issues/new) to discuss new features or improvements
- **Questions**: Open a discussion or issue for questions

## Contributing

We welcome contributions from the open source community! This document provides guidelines and instructions for contributing to this project.

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/daily-report.git
   cd daily-report
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/tanuj-empiricinfotech/daily-report.git
   ```
4. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

### Development Workflow

1. **Set up the development environment** following the [Setup Instructions](#setup-instructions)
2. **Make your changes** following our [Development Guidelines](#development-guidelines)
3. **Test your changes**:
   - Ensure the backend server runs without errors
   - Ensure the frontend builds and runs correctly
   - Test your specific changes thoroughly
   - Run linting: `npm run lint` (in frontend directory)
4. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add new feature description"
   git commit -m "fix: resolve bug description"
   git commit -m "docs: update documentation"
   git commit -m "refactor: improve code structure"
   ```
5. **Keep your branch updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** on GitHub

### Code Style Guidelines

This project follows clean code principles. Please ensure your contributions adhere to:

- **DRY (Don't Repeat Yourself)**: Extract repeated logic into reusable functions/components
- **Single Responsibility**: Each function/component should have one clear purpose
- **Type Safety**: Use TypeScript types throughout, avoid `any` type
- **Meaningful Names**: Use descriptive variable and function names
- **Small Functions**: Keep functions focused and under 20 lines when possible
- **Error Handling**: Handle errors explicitly with meaningful messages
- **Comments**: Write self-documenting code; comment only when explaining "why"
- **Import Types**: Use `import type` for TypeScript type imports

#### TypeScript Guidelines

- Always use `import type` for type-only imports
- Avoid using `any` type; use `unknown` or proper types instead
- Use interfaces for object shapes
- Leverage TypeScript's type inference where appropriate

#### Code Formatting

- Follow existing code style and indentation
- Use consistent naming conventions (camelCase for variables/functions, PascalCase for components)
- Keep lines under 120 characters when possible

### Pull Request Process

1. **Before submitting a PR**:
   - Ensure your code follows the project's code style
   - Update documentation if needed (README, API docs, etc.)
   - Add or update tests if applicable
   - Ensure all existing tests pass
   - Update `.env.example` if you've added new environment variables

2. **PR Title and Description**:
   - Use clear, descriptive titles
   - Describe what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes

3. **PR Review**:
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Keep discussions constructive and respectful

### Reporting Issues

When reporting bugs or requesting features:

1. **Check existing issues** to avoid duplicates
2. **Use clear, descriptive titles**
3. **Provide detailed information**:
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable
   - Error messages or logs

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Fix existing issues or bugs
- **New Features**: Add new functionality (please discuss major features in an issue first)
- **Documentation**: Improve README, code comments, or API documentation
- **Code Refactoring**: Improve code structure without changing functionality
- **Performance Improvements**: Optimize existing code
- **UI/UX Improvements**: Enhance the user interface and experience
- **Testing**: Add or improve tests

### Development Setup for Contributors

1. Follow the [Setup Instructions](#setup-instructions) to get the project running
2. Familiarize yourself with the [Architecture](#architecture) section
3. Review the [Development Guidelines](#development-guidelines)
4. Check the [API Endpoints](#api-endpoints) to understand the backend structure

### Questions?

- Open an issue for questions or discussions
- Check existing issues and discussions
- Review the codebase and documentation

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different viewpoints and experiences

Thank you for contributing to Daily Work Logging Platform! 🎉

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

ISC License is a permissive open source license that allows you to:
- Use the software commercially
- Modify the software
- Distribute the software
- Use the software privately

The only requirement is to include the original copyright notice and license text.

