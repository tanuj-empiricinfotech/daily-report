import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogsDataTable } from '@/components/logs/LogsDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatting';
import { useMyLogs } from '@/lib/query/hooks/useLogs';
import { useMyProjects } from '@/lib/query/hooks/useProjects';
import { IconPlus } from '@tabler/icons-react';

export function DailyLog() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Convert date range to strings for API
  const startDate = dateRange?.from ? formatDate(dateRange.from) : undefined;
  const endDate = dateRange?.to ? formatDate(dateRange.to) : undefined;

  // Fetch logs for the selected date range (for display)
  const { data: allLogs = [], isLoading: logsLoading } = useMyLogs(undefined, startDate, endDate);
  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();

  const filteredLogs = useMemo(() => {
    let filtered = allLogs;

    // Date filter is applied at the backend level via useMyLogs with date range
    // Only apply project filter on frontend since backend doesn't support project filter for user logs
    if (selectedProjectId) {
      filtered = filtered.filter((log) => log.project_id === selectedProjectId);
    }

    return filtered;
  }, [allLogs, selectedProjectId]);

  const handleNewLog = () => {
    navigate('/logs/create');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <Button onClick={handleNewLog}>
          <IconPlus className="size-4 mr-2" />
          New Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <LogsDataTable
        logs={filteredLogs}
        projects={projects}
        isAdmin={false}
        isLoading={logsLoading || projectsLoading}
      />
    </div>
  );
}
