/**
 * Team Hours Section Component
 * Container for team hours tracking with filters (team selector and date picker)
 * Following Clean Code principles - single responsibility, DRY, type safety
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDatePicker } from '@/components/ui/CalendarDatePicker';
import { TeamHoursTable } from './TeamHoursTable';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useTeamLogs } from '@/lib/query/hooks/useLogs';
import { useUsers } from '@/lib/query/hooks/useUsers';
import { useProjects } from '@/lib/query/hooks/useProjects';

interface TeamHoursSectionProps {
  /** Current user's team ID (default selection) */
  defaultTeamId: number | null;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * TeamHoursSection Component
 * Manages filters and coordinates data fetching for team hours table
 */
export function TeamHoursSection({
  defaultTeamId,
  loading = false,
  className,
}: TeamHoursSectionProps) {
  // State management for filters
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(defaultTeamId);

  // Convert date to YYYY-MM-DD format for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Data fetching hooks
  const { data: teams = [] } = useTeams({ isAdmin: true });
  const { data: logs = [], isLoading: logsLoading } = useTeamLogs(selectedTeamId, {
    date: dateString,
  });
  const { data: users = [] } = useUsers(true);
  const { data: projects = [] } = useProjects(selectedTeamId, true);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Team Hours Tracking</CardTitle>
            <CardDescription>
              View hours logged by team members for the selected date
            </CardDescription>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Team Selector */}
            <Select
              value={selectedTeamId?.toString() || ''}
              onValueChange={(val) => setSelectedTeamId(parseInt(val, 10))}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Selector */}
            <CalendarDatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              className="w-full sm:w-[200px]"
              placeholder="Select date"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Team Hours Table */}
        <TeamHoursTable
          logs={logs}
          users={users}
          projects={projects}
          loading={logsLoading || loading}
        />
      </CardContent>
    </Card>
  );
}
