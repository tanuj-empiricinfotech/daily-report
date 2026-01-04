# Microsoft Teams Daily Summary Integration Plan

## Overview
Implement a scheduled cron job that runs daily at 8:30 PM IST to send a formatted daily summary of all team members' tasks and hours to Microsoft Teams channels. One message per team, with configurable webhooks.

## Requirements
- **Schedule**: Daily at 8:30 PM IST (15:00 UTC)
- **Scope**: All teams (one message per team to their configured channel)
- **Configuration**: Per-team webhook URLs in database + global fallback env var
- **Control**: `ENABLE_TEAMS_SUMMARY` environment variable to enable/disable
- **Message Format**: Date as title, grouped by team members with their tasks and hours

## Architecture Decisions

### Dependencies
- **`node-cron`**: Lightweight cron scheduler (47KB, simple API, Unix cron syntax)
- **`axios`**: HTTP client for webhook calls (better error handling than fetch)

### Database Changes
- Add `webhook_url VARCHAR(2048) NULL` to `teams` table
- Index on `webhook_url` for performance
- Migration file: `002_add_teams_webhook.sql`

### New Files Structure
```
backend/src/
├── jobs/
│   ├── index.ts                           # Job initializer
│   └── teams-daily-summary.job.ts         # Cron job implementation
├── services/
│   ├── teams-summary.service.ts           # Business logic for generating summaries
│   └── teams-notification.service.ts      # Teams webhook communication
├── utils/
│   ├── timezone.util.ts                   # IST timezone conversions
│   └── teams-card-formatter.util.ts       # Teams Adaptive Card formatting
├── types/
│   └── teams.types.ts                     # TypeScript interfaces
└── config/
    └── jobs.config.ts                     # Job configuration constants
```

## Implementation Steps

### 1. Database Migration
**File**: `backend/src/db/migrations/002_add_teams_webhook.sql`
```sql
-- Add webhook_url column to teams table for Microsoft Teams integration
ALTER TABLE teams ADD COLUMN webhook_url VARCHAR(2048) NULL;

-- Add index for webhook lookups (optimization for cron job queries)
CREATE INDEX IF NOT EXISTS idx_teams_webhook_url ON teams(webhook_url)
WHERE webhook_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN teams.webhook_url IS
'Microsoft Teams incoming webhook URL for daily summary notifications. If NULL, falls back to TEAMS_WEBHOOK_URL environment variable.';
```

Update `backend/src/db/runMigrations.ts` to run all migration files sequentially.

### 2. Install Dependencies
```bash
cd backend
npm install node-cron axios
npm install --save-dev @types/node-cron @types/axios
```

### 3. Create Type Definitions
**File**: `backend/src/types/teams.types.ts`

```typescript
export interface TeamsSummaryData {
  teamId: number;
  teamName: string;
  date: string; // YYYY-MM-DD
  userSummaries: UserDailySummary[];
  totalHours: number;
}

export interface UserDailySummary {
  userId: number;
  userName: string;
  tasks: TaskSummary[];
  totalHours: number;
}

export interface TaskSummary {
  projectName: string;
  taskDescription: string;
  actualTimeSpent: number;
  trackedTime: number;
}

export interface TeamsWebhookConfig {
  url: string;
  timeout: number;
  retries: number;
}

export interface AdaptiveCardPayload {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: any;
  }>;
}
```

Update `backend/src/types/index.ts`:
```typescript
export interface Team {
  id: number;
  name: string;
  description: string | null;
  created_by: number | null;
  webhook_url: string | null; // ADD THIS LINE
  created_at: Date;
  updated_at: Date;
}
```

### 4. Configuration
**File**: `backend/src/config/jobs.config.ts`

```typescript
export const JOB_CONFIG = {
  TEAMS_DAILY_SUMMARY: {
    // Cron expression for 8:30 PM IST (3:00 PM UTC)
    // IST is UTC+5:30, so 20:30 IST = 15:00 UTC
    CRON_SCHEDULE: '30 15 * * *',
    TIMEZONE: 'UTC',
    ENABLED_ENV_VAR: 'ENABLE_TEAMS_SUMMARY',
  },
  WEBHOOK: {
    TIMEOUT_MS: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
  },
} as const;

export const TIMEZONE_CONFIG = {
  IST_OFFSET_HOURS: 5,
  IST_OFFSET_MINUTES: 30,
} as const;
```

### 5. Timezone Utility
**File**: `backend/src/utils/timezone.util.ts`

```typescript
import { TIMEZONE_CONFIG } from '../config/jobs.config';

/**
 * Get current date in IST timezone as YYYY-MM-DD string
 * IST = UTC+5:30
 */
export function getCurrentDateIST(): string {
  const now = new Date();
  const istOffset = (TIMEZONE_CONFIG.IST_OFFSET_HOURS * 60 + TIMEZONE_CONFIG.IST_OFFSET_MINUTES) * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convert UTC cron time to IST equivalent
 * Example: 20:30 IST -> 15:00 UTC
 */
export function istToUTCHour(istHour: number, istMinute: number): { hour: number; minute: number } {
  const totalMinutes = istHour * 60 + istMinute - (TIMEZONE_CONFIG.IST_OFFSET_HOURS * 60 + TIMEZONE_CONFIG.IST_OFFSET_MINUTES);
  let utcHour = Math.floor(totalMinutes / 60);
  let utcMinute = totalMinutes % 60;

  if (utcHour < 0) {
    utcHour += 24;
  }
  if (utcMinute < 0) {
    utcMinute += 60;
    utcHour -= 1;
  }

  return { hour: utcHour, minute: utcMinute };
}
```

### 6. Teams Card Formatter
**File**: `backend/src/utils/teams-card-formatter.util.ts`

```typescript
import { TeamsSummaryData, AdaptiveCardPayload } from '../types/teams.types';

/**
 * Format team daily summary into Microsoft Teams Adaptive Card
 * Adaptive Card Schema: https://adaptivecards.io/schemas/adaptive-card.json
 */
export function formatTeamsSummaryCard(summary: TeamsSummaryData): AdaptiveCardPayload {
  const { teamName, date, userSummaries, totalHours } = summary;

  // Build user sections
  const userSections = userSummaries.map(user => ({
    type: 'Container',
    items: [
      {
        type: 'TextBlock',
        text: `**${user.userName}** (${user.totalHours.toFixed(2)} hours)`,
        weight: 'Bolder',
        size: 'Medium',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: user.tasks.map(task => ({
          title: task.projectName,
          value: `${task.taskDescription} - ${task.actualTimeSpent.toFixed(2)}h`,
        })),
      },
    ],
    separator: true,
    spacing: 'Medium',
  }));

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: `Daily Summary - ${date}`,
              weight: 'Bolder',
              size: 'ExtraLarge',
              wrap: true,
            },
            {
              type: 'TextBlock',
              text: `Team: ${teamName}`,
              size: 'Large',
              wrap: true,
            },
            {
              type: 'TextBlock',
              text: `Total Hours: ${totalHours.toFixed(2)}`,
              weight: 'Bolder',
              color: 'Accent',
              wrap: true,
            },
            {
              type: 'Container',
              items: userSummaries.length > 0
                ? userSections
                : [
                    {
                      type: 'TextBlock',
                      text: 'No tasks logged for today.',
                      wrap: true,
                      color: 'Attention',
                    },
                  ],
              spacing: 'Medium',
            },
          ],
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        },
      },
    ],
  };
}
```

### 7. Teams Summary Service
**File**: `backend/src/services/teams-summary.service.ts`

```typescript
import { TeamsRepository } from '../db/repositories/teams.repository';
import { UsersRepository } from '../db/repositories/users.repository';
import { LogsRepository } from '../db/repositories/logs.repository';
import { ProjectsRepository } from '../db/repositories/projects.repository';
import { TeamsSummaryData, UserDailySummary, TaskSummary } from '../types/teams.types';
import { Team, User, DailyLog, Project } from '../types';

export class TeamsSummaryService {
  private teamsRepository: TeamsRepository;
  private usersRepository: UsersRepository;
  private logsRepository: LogsRepository;
  private projectsRepository: ProjectsRepository;

  constructor() {
    this.teamsRepository = new TeamsRepository();
    this.usersRepository = new UsersRepository();
    this.logsRepository = new LogsRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  /**
   * Generate daily summaries for all teams
   */
  async generateAllTeamsSummaries(date: string): Promise<TeamsSummaryData[]> {
    const teams = await this.teamsRepository.findAll();
    const summaries: TeamsSummaryData[] = [];

    for (const team of teams) {
      const summary = await this.generateTeamSummary(team, date);
      summaries.push(summary);
    }

    return summaries;
  }

  private async generateTeamSummary(team: Team, date: string): Promise<TeamsSummaryData> {
    const logs = await this.logsRepository.findByTeamId(team.id, { date });
    const users = await this.usersRepository.findByTeamId(team.id);
    const userSummaries = await this.buildUserSummaries(users, logs);
    const totalHours = userSummaries.reduce((sum, user) => sum + user.totalHours, 0);

    return {
      teamId: team.id,
      teamName: team.name,
      date,
      userSummaries,
      totalHours,
    };
  }

  private async buildUserSummaries(users: User[], logs: DailyLog[]): Promise<UserDailySummary[]> {
    const userSummaries: UserDailySummary[] = [];

    for (const user of users) {
      const userLogs = logs.filter(log => log.user_id === user.id);
      if (userLogs.length === 0) continue;

      const tasks = await this.buildTaskSummaries(userLogs);
      const totalHours = tasks.reduce((sum, task) => sum + task.actualTimeSpent, 0);

      userSummaries.push({
        userId: user.id,
        userName: user.name,
        tasks,
        totalHours,
      });
    }

    return userSummaries;
  }

  private async buildTaskSummaries(logs: DailyLog[]): Promise<TaskSummary[]> {
    const tasks: TaskSummary[] = [];
    const projectCache = new Map<number, Project>();

    for (const log of logs) {
      let project = projectCache.get(log.project_id);

      if (!project) {
        project = await this.projectsRepository.findById(log.project_id);
        if (project) projectCache.set(log.project_id, project);
      }

      const actualTime = typeof log.actual_time_spent === 'string'
        ? parseFloat(log.actual_time_spent)
        : log.actual_time_spent;

      const trackedTime = typeof log.tracked_time === 'string'
        ? parseFloat(log.tracked_time)
        : log.tracked_time;

      tasks.push({
        projectName: project?.name || 'Unknown Project',
        taskDescription: log.task_description,
        actualTimeSpent: actualTime,
        trackedTime: trackedTime,
      });
    }

    return tasks;
  }
}
```

### 8. Teams Notification Service
**File**: `backend/src/services/teams-notification.service.ts`

```typescript
import axios, { AxiosError } from 'axios';
import { TeamsSummaryData } from '../types/teams.types';
import { formatTeamsSummaryCard } from '../utils/teams-card-formatter.util';
import { JOB_CONFIG } from '../config/jobs.config';

export class TeamsNotificationService {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor() {
    this.timeout = JOB_CONFIG.WEBHOOK.TIMEOUT_MS;
    this.maxRetries = JOB_CONFIG.WEBHOOK.MAX_RETRIES;
    this.retryDelay = JOB_CONFIG.WEBHOOK.RETRY_DELAY_MS;
  }

  async sendDailySummary(summary: TeamsSummaryData, webhookUrl: string): Promise<boolean> {
    const card = formatTeamsSummaryCard(summary);
    return await this.sendWithRetry(webhookUrl, card);
  }

  private async sendWithRetry(webhookUrl: string, payload: any, attempt: number = 1): Promise<boolean> {
    try {
      await axios.post(webhookUrl, payload, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(`[TeamsNotification] Successfully sent summary (attempt ${attempt})`);
      return true;

    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`[TeamsNotification] Failed (attempt ${attempt}/${this.maxRetries}):`, {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
      });

      if (attempt < this.maxRetries) {
        console.log(`[TeamsNotification] Retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return await this.sendWithRetry(webhookUrl, payload, attempt + 1);
      }

      console.error('[TeamsNotification] Max retries reached');
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname.includes('webhook.office.com');
    } catch {
      return false;
    }
  }
}
```

### 9. Cron Job
**File**: `backend/src/jobs/teams-daily-summary.job.ts`

```typescript
import cron from 'node-cron';
import { TeamsSummaryService } from '../services/teams-summary.service';
import { TeamsNotificationService } from '../services/teams-notification.service';
import { TeamsRepository } from '../db/repositories/teams.repository';
import { getCurrentDateIST } from '../utils/timezone.util';
import { JOB_CONFIG } from '../config/jobs.config';
import { TeamsSummaryData } from '../types/teams.types';

export class TeamsDailySummaryJob {
  private summaryService: TeamsSummaryService;
  private notificationService: TeamsNotificationService;
  private teamsRepository: TeamsRepository;
  private isRunning: boolean = false;

  constructor() {
    this.summaryService = new TeamsSummaryService();
    this.notificationService = new TeamsNotificationService();
    this.teamsRepository = new TeamsRepository();
  }

  start(): void {
    const isEnabled = process.env.ENABLE_TEAMS_SUMMARY === 'true';

    if (!isEnabled) {
      console.log('[TeamsDailySummaryJob] Disabled. Set ENABLE_TEAMS_SUMMARY=true to enable.');
      return;
    }

    console.log(`[TeamsDailySummaryJob] Scheduling: ${JOB_CONFIG.TEAMS_DAILY_SUMMARY.CRON_SCHEDULE}`);

    cron.schedule(JOB_CONFIG.TEAMS_DAILY_SUMMARY.CRON_SCHEDULE, async () => {
      await this.execute();
    }, {
      timezone: JOB_CONFIG.TEAMS_DAILY_SUMMARY.TIMEZONE,
    });

    console.log('[TeamsDailySummaryJob] Job scheduled');
  }

  async execute(): Promise<void> {
    if (this.isRunning) {
      console.log('[TeamsDailySummaryJob] Already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[TeamsDailySummaryJob] Starting...');

      const date = getCurrentDateIST();
      console.log(`[TeamsDailySummaryJob] Date: ${date} (IST)`);

      const summaries = await this.summaryService.generateAllTeamsSummaries(date);
      console.log(`[TeamsDailySummaryJob] Generated ${summaries.length} summaries`);

      const results = await this.sendNotifications(summaries);

      const duration = Date.now() - startTime;
      console.log(`[TeamsDailySummaryJob] Completed in ${duration}ms. Success: ${results.success}/${results.total}`);

    } catch (error) {
      console.error('[TeamsDailySummaryJob] Failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async sendNotifications(summaries: TeamsSummaryData[]): Promise<{ success: number; total: number }> {
    let successCount = 0;
    const globalWebhook = process.env.TEAMS_WEBHOOK_URL;

    for (const summary of summaries) {
      const team = await this.teamsRepository.findById(summary.teamId);
      const webhookUrl = team?.webhook_url || globalWebhook;

      if (!webhookUrl) {
        console.log(`[TeamsDailySummaryJob] No webhook for team: ${summary.teamName}`);
        continue;
      }

      if (!this.notificationService.validateWebhookUrl(webhookUrl)) {
        console.error(`[TeamsDailySummaryJob] Invalid webhook for team: ${summary.teamName}`);
        continue;
      }

      if (summary.userSummaries.length === 0) {
        console.log(`[TeamsDailySummaryJob] No activity for team: ${summary.teamName}`);
        continue;
      }

      const success = await this.notificationService.sendDailySummary(summary, webhookUrl);
      if (success) successCount++;
    }

    return { success: successCount, total: summaries.length };
  }
}
```

### 10. Job Initializer
**File**: `backend/src/jobs/index.ts`

```typescript
import { TeamsDailySummaryJob } from './teams-daily-summary.job';

export function initializeJobs(): void {
  console.log('[Jobs] Initializing scheduled jobs...');

  const teamsSummaryJob = new TeamsDailySummaryJob();
  teamsSummaryJob.start();

  console.log('[Jobs] All jobs initialized');
}

export { TeamsDailySummaryJob };
```

### 11. Update Main Entry Point
**File**: `backend/src/index.ts`

Add after the `app.listen()` call:

```typescript
import { initializeJobs } from './jobs';

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Initialize scheduled jobs
  initializeJobs();
});
```

### 12. Environment Variables
**File**: `backend/.env.example`

Add these lines:

```bash
# Microsoft Teams Integration
# Enable daily summary notifications to Teams channels
ENABLE_TEAMS_SUMMARY=false

# Global Teams webhook URL (fallback if team-specific webhook not configured)
# Get this from Teams channel > Connectors > Incoming Webhook
TEAMS_WEBHOOK_URL=https://yourorg.webhook.office.com/webhookb2/...
```

### 13. Update Teams Repository
**File**: `backend/src/db/repositories/teams.repository.ts`

Add methods:

```typescript
async updateWebhookUrl(id: number, webhookUrl: string | null): Promise<Team | null> {
  const result = await query(
    `UPDATE ${this.tableName} SET webhook_url = $1 WHERE id = $2 RETURNING *`,
    [webhookUrl, id]
  );
  return result.rows[0] || null;
}

async findAllWithWebhooks(): Promise<Team[]> {
  const result = await query(
    `SELECT * FROM ${this.tableName} WHERE webhook_url IS NOT NULL`
  );
  return result.rows;
}
```

## Data Flow

```
Cron Trigger (8:30 PM IST / 15:00 UTC)
  ↓
TeamsDailySummaryJob.execute()
  ↓
TeamsSummaryService.generateAllTeamsSummaries(date)
  ↓
For each team:
  - LogsRepository.findByTeamId(teamId, { date })
  - UsersRepository.findByTeamId(teamId)
  - ProjectsRepository.findById(projectId)
  - Group by user, aggregate hours
  ↓
TeamsSummaryData[]
  ↓
For each summary:
  - formatTeamsSummaryCard() → Adaptive Card JSON
  - TeamsNotificationService.sendDailySummary()
  - axios.post(webhookUrl, card)
  ↓
Microsoft Teams Channel
```

## Message Format (Adaptive Card)

```
┌─────────────────────────────────────┐
│ Daily Summary - 2026-01-03          │
│ Team: Engineering Team              │
│ Total Hours: 20.5                   │
├─────────────────────────────────────┤
│ **John Doe** (8.5 hours)            │
│ ├─ Project Alpha: Feature X - 4.5h  │
│ └─ Project Beta: Bug fix - 4.0h     │
├─────────────────────────────────────┤
│ **Jane Smith** (12.0 hours)         │
│ ├─ Project Alpha: API work - 8.0h   │
│ └─ Project Gamma: Testing - 4.0h    │
└─────────────────────────────────────┘
```

## Testing Strategy

### Local Testing

**Option 1: Manual Trigger Endpoint** (recommended)

Add to `backend/src/routes/index.ts` (dev only):

```typescript
if (process.env.NODE_ENV === 'development') {
  router.post('/test/teams-summary', async (req, res) => {
    const { TeamsDailySummaryJob } = await import('../jobs/teams-daily-summary.job');
    const job = new TeamsDailySummaryJob();
    await job.execute();
    res.json({ success: true, message: 'Job executed' });
  });
}
```

Test with:
```bash
curl -X POST http://localhost:3000/api/test/teams-summary
```

**Option 2: Test Webhook Manually**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "attachments": [{
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [{
          "type": "TextBlock",
          "text": "Test Message"
        }]
      }
    }]
  }' \
  YOUR_WEBHOOK_URL
```

### Test Scenarios
- ✅ Teams with activity
- ✅ Team with no logs (skip)
- ✅ Missing webhook (skip)
- ✅ Invalid webhook (error)
- ✅ Timeout (retry)
- ✅ Network failure (retry)

## Error Handling

| Scenario | Action |
|----------|--------|
| No webhook | Log warning, skip team |
| Invalid webhook | Validate & log error, skip |
| Request fails | Retry 3x with 2s delay, then skip |
| No logs | Skip notification |
| DB query fails | Log error, retry next day |
| Missing project/user | Use "Unknown Project" |

## Clean Code Principles Applied

- ✅ **DRY**: Centralized formatting, webhook sending
- ✅ **Single Responsibility**: Separate concerns in services
- ✅ **Abstraction**: Service layer hides implementation
- ✅ **Type Safety**: Full TypeScript types
- ✅ **Configuration**: Constants in config file
- ✅ **Error Handling**: Graceful failures, logging
- ✅ **Testability**: Manual trigger, pure functions

## Deployment Checklist

- [ ] Run migration `002_add_teams_webhook.sql`
- [ ] Install dependencies: `npm install node-cron axios`
- [ ] Set `ENABLE_TEAMS_SUMMARY=true` in production
- [ ] Configure `TEAMS_WEBHOOK_URL`
- [ ] Verify server timezone is UTC
- [ ] Test webhook before enabling
- [ ] Monitor job execution logs

## Rollback Plan

1. Set `ENABLE_TEAMS_SUMMARY=false`
2. Revert code: `git revert <commit>`
3. (Optional) Drop column: `ALTER TABLE teams DROP COLUMN webhook_url;`

## Implementation Order

1. ✅ Database migration
2. ✅ Install dependencies
3. ✅ Create types
4. ✅ Create config
5. ✅ Create utils (timezone, formatter)
6. ✅ Create services (summary, notification)
7. ✅ Create job
8. ✅ Update main app
9. ✅ Update env vars
10. ✅ Test locally
11. ✅ Deploy

## Critical Files

1. `backend/src/services/teams-summary.service.ts`
2. `backend/src/jobs/teams-daily-summary.job.ts`
3. `backend/src/services/teams-notification.service.ts`
4. `backend/src/utils/teams-card-formatter.util.ts`
5. `backend/src/db/migrations/002_add_teams_webhook.sql`

## Task List
[x] Create database migration for webhook_url column
[x] Install dependencies (node-cron, axios)
[x] Create TypeScript type definitions for Teams integration
[x] Create jobs configuration file
[x] Create timezone utility functions
[x] Create Teams Adaptive Card formatter utility
[x] Create Teams summary service
[x] Create Teams notification service
[x] Create Teams daily summary cron job
[x] Create job initializer
[x] Update Teams repository with webhook methods
[x] Update main entry point to initialize jobs
[x] Update environment configuration files
[x] Update Team interface in types