/**
 * TeamLeaderboard Component
 *
 * Full leaderboard table showing all team members ranked by hours logged.
 * Displays rank, name, hours, and percentage of team total.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IconTrophy, IconMedal, IconAward } from '@tabler/icons-react';
import { formatDuration, getUserInitials } from '@/utils/analytics';
import type { UserChartData } from '@/utils/chart';

interface TeamLeaderboardProps {
  data: UserChartData[];
  loading?: boolean;
}

const RANK_STYLES = [
  { icon: IconTrophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { icon: IconMedal, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  { icon: IconAward, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
] as const;

export function TeamLeaderboard({ data, loading = false }: TeamLeaderboardProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.hours - a.hours);
  }, [data]);

  const totalHours = useMemo(() => {
    return sortedData.reduce((sum, u) => sum + u.hours, 0);
  }, [sortedData]);

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

  if (sortedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No activity data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <IconTrophy className="h-5 w-5 text-yellow-500" />
          Team Leaderboard
        </CardTitle>
        <CardDescription>Members ranked by hours logged (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedData.map((member, index) => {
            const rank = index + 1;
            const percentage = totalHours > 0 ? (member.hours / totalHours) * 100 : 0;
            const rankStyle = index < 3 ? RANK_STYLES[index] : null;
            const RankIcon = rankStyle?.icon;

            return (
              <div
                key={member.name}
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
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of team total</p>
                </div>

                {/* Hours */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatDuration(member.hours)}</p>
                </div>

                {/* Bar indicator */}
                <div className="w-20 shrink-0 hidden sm:block">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
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
