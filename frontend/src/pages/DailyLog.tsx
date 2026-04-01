import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogsDataTable } from '@/components/logs/LogsDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/button';
import { formatDate, normalizeDateForComparison } from '@/utils/formatting';
import { istToIso } from '@/utils/date';
import { useMyLogs, useTeamLogs } from '@/lib/query/hooks/useLogs';
import { useMyProjects, useProjects } from '@/lib/query/hooks/useProjects';
import { useUsers, useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { IconPlus } from '@tabler/icons-react';

export function DailyLog() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Single project filter for members
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Multi-select filters for admins
  const [selectedProjectIds, setSelectedProjectIds] = useState<(string | number)[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);

  // Convert date range to IST strings for display and API
  const startDate = dateRange?.from ? formatDate(dateRange.from) : undefined;
  const endDate = dateRange?.to ? formatDate(dateRange.to) : undefined;

  // Fetch logs for the selected date range
  // If no date range is selected, fetch recent logs (last 30 days as fallback)
  // Convert IST dates to ISO for API calls
  const apiStartDate = startDate ? istToIso(startDate) : istToIso(formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const apiEndDate = endDate ? istToIso(endDate) : istToIso(formatDate(new Date()));

  // Fetch teams for admins (needed to determine team_id if user doesn't have one)
  const { data: teams = [] } = useTeams({ isAdmin });

  // Determine teamId for admin: use user's team_id if available, otherwise use first team
  const adminTeamId = useMemo(() => {
    if (!isAdmin) return null;
    if (user?.team_id) return user.team_id;
    if (teams.length > 0) return teams[0].id;
    return null;
  }, [isAdmin, user?.team_id, teams]);

  // Fetch data based on user role
  const { data: myLogs = [], isLoading: myLogsLoading } = useMyLogs(
    undefined,
    apiStartDate,
    apiEndDate,
    !isAdmin
  );
  const { data: teamLogs = [], isLoading: teamLogsLoading } = useTeamLogs(
    adminTeamId,
    { startDate: apiStartDate, endDate: apiEndDate }
  );
  const { data: myProjects = [], isLoading: myProjectsLoading } = useMyProjects();
  const { data: allProjects = [], isLoading: allProjectsLoading } = useProjects(adminTeamId, isAdmin);
  // Fetch users: for admins, fetch by team; for members, fetch all (for filter dropdown)
  const { data: allUsers = [], isLoading: allUsersLoading } = useUsers(isAdmin);
  const { data: teamUsers = [], isLoading: teamUsersLoading } = useUsersByTeam(adminTeamId, isAdmin);
  const users = isAdmin ? teamUsers : allUsers;
  const usersLoading = isAdmin ? teamUsersLoading : allUsersLoading;

  // Use the appropriate data based on role
  const allLogs = isAdmin ? teamLogs : myLogs;
  const projects = isAdmin ? allProjects : myProjects;
  const logsLoading = isAdmin ? teamLogsLoading : myLogsLoading;
  const projectsLoading = isAdmin ? allProjectsLoading : myProjectsLoading;

  const filteredLogs = useMemo(() => {
    let filtered = allLogs;

    // Apply date filter on frontend to ensure accuracy (handles timezone issues)
    if (dateRange?.from && dateRange?.to) {
      const startDateStr = formatDate(dateRange.from);
      const endDateStr = formatDate(dateRange.to);
      filtered = filtered.filter((log) => {
        const logDateStr = normalizeDateForComparison(log.date);
        return logDateStr >= startDateStr && logDateStr <= endDateStr;
      });
    } else if (dateRange?.from) {
      const startDateStr = formatDate(dateRange.from);
      filtered = filtered.filter((log) => {
        const logDateStr = normalizeDateForComparison(log.date);
        return logDateStr >= startDateStr;
      });
    } else if (dateRange?.to) {
      const endDateStr = formatDate(dateRange.to);
      filtered = filtered.filter((log) => {
        const logDateStr = normalizeDateForComparison(log.date);
        return logDateStr <= endDateStr;
      });
    }

    // Apply filters based on role
    if (isAdmin) {
      // Admin: Multi-select project filter
      if (selectedProjectIds.length > 0) {
        filtered = filtered.filter((log) =>
          selectedProjectIds.includes(log.project_id)
        );
      }

      // Admin: Multi-select user filter
      if (selectedUserIds.length > 0) {
        filtered = filtered.filter((log) =>
          selectedUserIds.includes(log.user_id)
        );
      }
    } else {
      // Member: Single project filter
      if (selectedProjectId) {
        filtered = filtered.filter((log) => log.project_id === selectedProjectId);
      }
    }

    return filtered;
  }, [allLogs, dateRange, isAdmin, selectedProjectId, selectedProjectIds, selectedUserIds]);

  // April Fools' — runaway button + confetti (only on April 1st)
  const isAprilFools = new Date().getMonth() === 3 && new Date().getDate() === 1;
  const dodgeCountRef = useRef(0);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [showFoolsToast, setShowFoolsToast] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const MAX_DODGES = 3;

  const triggerConfetti = useCallback(() => {
    const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.5,
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 3000);
  }, []);

  const handleNewLog = () => {
    if (isAprilFools && dodgeCountRef.current < MAX_DODGES) {
      dodgeCountRef.current++;
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 80;
      setButtonOffset({ x, y });
      // Snap back to original position after a short delay
      setTimeout(() => setButtonOffset({ x: 0, y: 0 }), 600);
      return;
    }

    if (isAprilFools && dodgeCountRef.current === MAX_DODGES) {
      dodgeCountRef.current++;
      setButtonOffset({ x: 0, y: 0 });
      setShowFoolsToast(true);
      triggerConfetti();
      setTimeout(() => {
        setShowFoolsToast(false);
        navigate('/logs/create');
      }, 2000);
      return;
    }

    navigate('/logs/create');
  };

  // Transform data for multi-select
  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects]
  );

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: user.name })),
    [users]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <Button
          onClick={handleNewLog}
          style={isAprilFools ? {
            transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)`,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          } : undefined}
        >
          <IconPlus className="size-4 mr-2" />
          New Log
        </Button>
      </div>

      {/* April Fools' confetti */}
      {confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute animate-bounce"
              style={{
                left: `${piece.x}%`,
                top: '-10px',
                width: '8px',
                height: '8px',
                borderRadius: piece.id % 2 === 0 ? '50%' : '0',
                backgroundColor: piece.color,
                animation: `fall ${1.5 + piece.delay}s ease-in ${piece.delay}s forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* April Fools' toast */}
      {showFoolsToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] bg-background border rounded-2xl shadow-2xl px-8 py-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-lg font-bold">Happy April Fools!</p>
          <p className="text-sm text-muted-foreground">Gotcha! Redirecting you now...</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            // Admin filters with multi-select
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DateRangePicker
                label="Date Range"
                value={dateRange}
                onChange={setDateRange}
              />
              <MultiSelect
                label="Projects"
                placeholder="All projects"
                options={projectOptions}
                value={selectedProjectIds}
                onChange={setSelectedProjectIds}
                loading={projectsLoading}
              />
              <MultiSelect
                label="Team Members"
                placeholder="All members"
                options={userOptions}
                value={selectedUserIds}
                onChange={setSelectedUserIds}
                loading={usersLoading}
              />
            </div>
          ) : (
            // Member filters with single-select
            <div className="grid grid-cols-2 gap-4">
              <DateRangePicker
                label="Date Range"
                value={dateRange}
                onChange={setDateRange}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Project</label>
                <Select
                  value={selectedProjectId?.toString() || 'all'}
                  onValueChange={(value) =>
                    setSelectedProjectId(value === 'all' ? null : parseInt(value, 10))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LogsDataTable
        logs={filteredLogs}
        projects={projects}
        users={users}
        isAdmin={isAdmin}
        isLoading={logsLoading || projectsLoading}
      />
    </div>
  );
}
