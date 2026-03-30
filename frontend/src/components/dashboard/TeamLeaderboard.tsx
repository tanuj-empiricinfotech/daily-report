/**
 * TeamLeaderboard Component
 *
 * Full leaderboard table showing ALL team members ranked by hours logged.
 * Members with 0 hours are included at the bottom.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IconTrophy, IconMedal, IconAward } from '@tabler/icons-react';
import { formatDuration, getUserInitials } from '@/utils/analytics';
import { parseTimeInput } from '@/utils/time';
import { generateChartColors } from '@/lib/theme';
import type { DailyLog } from '@/lib/api/types';

interface LeaderboardUser {
  id: number;
  name: string;
}

interface TeamLeaderboardProps {
  users: LeaderboardUser[];
  logs: DailyLog[];
  loading?: boolean;
}

const RANK_STYLES = [
  { icon: IconTrophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { icon: IconMedal, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  { icon: IconAward, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
] as const;

export function TeamLeaderboard({ users, logs, loading = false }: TeamLeaderboardProps) {
  const rankedMembers = useMemo(() => {
    // Aggregate hours per user from logs
    const hoursMap = new Map<number, number>();
    for (const log of logs) {
      const hours = parseTimeInput(log.actual_time_spent);
      hoursMap.set(log.user_id, (hoursMap.get(log.user_id) ?? 0) + hours);
    }

    const colors = generateChartColors(users.length);

    // Build entries for ALL users, including those with 0 hours
    return users
      .map((user, i) => ({
        id: user.id,
        name: user.name,
        hours: hoursMap.get(user.id) ?? 0,
        fill: colors[i % colors.length],
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [users, logs]);

  const totalHours = useMemo(() => {
    return rankedMembers.reduce((sum, u) => sum + u.hours, 0);
  }, [rankedMembers]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No team members found</p>
        </CardContent>
      </Card>
    );
  }

  const maxHours = rankedMembers[0]?.hours ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <IconTrophy className="h-5 w-5 text-yellow-500" />
          Team Leaderboard
        </CardTitle>
        <CardDescription>All members ranked by hours logged (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rankedMembers.map((member, index) => {
            const rank = index + 1;
            const percentage = totalHours > 0 ? (member.hours / totalHours) * 100 : 0;
            const barWidth = maxHours > 0 ? (member.hours / maxHours) * 100 : 0;
            const rankStyle = index < 3 && member.hours > 0 ? RANK_STYLES[index] : null;
            const RankIcon = rankStyle?.icon;

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                  rankStyle ? rankStyle.border : 'border-border'
                }`}
              >
                {/* Rank */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  rankStyle ? `${rankStyle.bg} ${rankStyle.color}` : 'bg-muted text-muted-foreground'
                }`}>
                  {RankIcon ? <RankIcon className="h-4 w-4" /> : rank}
                </div>

                {/* Avatar */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: member.fill }}
                >
                  {getUserInitials(member.name)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={member.name}>{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.hours > 0 ? `${percentage.toFixed(1)}% of team total` : 'No activity'}
                  </p>
                </div>

                {/* Hours */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${member.hours === 0 ? 'text-muted-foreground' : ''}`}>
                    {member.hours > 0 ? formatDuration(member.hours) : '0h'}
                  </p>
                </div>

                {/* Bar indicator */}
                <div className="w-20 shrink-0 hidden sm:block">
                  <div
                    className="h-2 rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(barWidth)}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: member.fill,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team total */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Team Total</span>
          <span className="text-sm font-bold">{formatDuration(totalHours)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
