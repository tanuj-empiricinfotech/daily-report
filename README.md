# Daily Work Logging Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](#contributing)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/tanuj-empiricinfotech/daily-report)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green.svg)](https://daily-report-omega.vercel.app)

A full-stack daily work logging platform with secure authentication, encrypted team chat, AI-powered monthly recaps, and comprehensive analytics. Built with PostgreSQL, Express.js, React 19, and shadcn/ui.

> **Links**: 
> - **Repository**: [GitHub](https://github.com/tanuj-empiricinfotech/daily-report)
> - **Live Demo**: [daily-report-omega.vercel.app](https://daily-report-omega.vercel.app)
> - **Detailed Docs**: [docs/](./docs/)

## Features

### Core
- **Daily Work Logging** - Log tasks with project selection, time tracking (actual vs tracked), and bulk entry support
- **Team & Project Management** - Multi-team support with team-scoped projects, assignments, and data isolation
- **Role-Based Dashboards** - Admin dashboard with team leaderboard and analytics; member dashboard with personal metrics

### Security & Auth
- **Refresh Token Authentication** - HS256 JWT with short-lived access tokens (15 min) and rotating refresh tokens (7 days)
- **AES-256-GCM Message Encryption** - All chat messages encrypted at rest
- **iOS Safari Compatibility** - localStorage token fallback when cookies are blocked

### Communication
- **Real-Time Team Chat** - SSE-powered messaging with conversation threads and reply support
- **Typing Indicators** - Live typing status for team members
- **Draft Persistence** - Unsent messages survive page navigation
- **Vanishing Messages** - Auto-deleting messages with configurable expiry
- **Microsoft Teams Integration** - Automated daily summary reports via webhooks

### Intelligence
- **Monthly Recap** - AI-powered monthly performance summaries for teams and individuals
- **Advanced Analytics** - Time series charts, project performance, team metrics with customizable date ranges
- **Seasonal Events** - Pluggable seasonal theming adapter with visual effects (snow, fireworks, confetti, etc.)

### UX
- **Mobile Responsive** - Sidebar auto-close, responsive chat layout
- **Searchable Dropdowns** - MultiSelect component for user and project assignment
- **Version Check** - Automatic reload prompt on new deploys
- **Theme Support** - Light, dark, and system modes
- **Centralized Storage** - StorageService abstraction for all localStorage access

## Tech Stack

### Backend
- **Node.js** + **TypeScript** + **Express.js**
- **PostgreSQL 16** (Dockerized)
- **JWT** (jsonwebtoken) with refresh token rotation
- **AES-256-GCM** encryption (Node.js crypto)
- **bcryptjs**, **express-validator**, **express-rate-limit**
- **node-cron** for scheduled jobs
- **SSE** for real-time events

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Redux Toolkit** + **Redux Persist** + **TanStack Query**
- **shadcn/ui** (Radix UI) + **Tailwind CSS v4**
- **Recharts** + **TanStack Table**
- **React Router v6** + **Axios**

## Quick Start

### Prerequisites
- Node.js v18+
- Docker and Docker Compose

### Setup

```bash
# Clone the repository
git clone https://github.com/tanuj-empiricinfotech/daily-report.git
cd daily-report

# Install all dependencies (root, backend, frontend)
npm run install:all

# Start PostgreSQL
docker-compose up -d

# Run database migrations
npm run db:migrate

# Start both servers
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/daily_report

# Auth - REQUIRED: use a strong random secret (min 32 chars)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_HTTPS=false

# Encryption - REQUIRED for team chat message encryption
MESSAGE_ENCRYPTION_KEY=your-256-bit-hex-key

# Timezone (decimal hours offset from UTC, e.g. 5.5 for IST)
TIMEZONE_OFFSET_HOURS=5.5

# Microsoft Teams (optional)
ENABLE_TEAMS_SUMMARY=false
TEAMS_WEBHOOK_URL=https://yourcompany.webhook.office.com/webhookb2/...

# Admin seed account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
ADMIN_NAME=Admin User
```

> **Note**: `JWT_SECRET` must be changed from the default in production. The server will refuse to start otherwise. `MESSAGE_ENCRYPTION_KEY` should be a 64-character hex string (256 bits). Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

## Scripts

### Root Level
| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run build` | Build both for production |
| `npm run install:all` | Install all dependencies |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset database |

### Backend (`cd backend`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

### Frontend (`cd frontend`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

## Documentation

See the [docs/](./docs/) folder for detailed documentation:
- [Project Overview](./docs/project-overview.md) - Architecture, database schema, API structure, and component details

## Contributing

We welcome contributions from the community.

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/daily-report.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Follow the setup instructions above
5. Make your changes following the project's clean code principles
6. Commit with conventional messages: `feat:`, `fix:`, `docs:`, `refactor:`
7. Push and open a Pull Request

### Code Style

- **TypeScript** throughout, avoid `any`
- **DRY** - extract reusable functions and components
- **Single Responsibility** - one purpose per function/component
- **Meaningful names** - descriptive variables and functions
- **Small functions** - under 20 lines when possible
- Use `import type` for type-only imports

### Reporting Issues

- Check existing issues before creating new ones
- Include steps to reproduce, expected vs actual behavior, and environment details
- Screenshots for UI issues

## Support

- **Issues**: [GitHub Issues](https://github.com/tanuj-empiricinfotech/daily-report/issues)
- **Feature Requests**: [Open an issue](https://github.com/tanuj-empiricinfotech/daily-report/issues/new)

## License

ISC License - see [LICENSE](LICENSE) for details.
