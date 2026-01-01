import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogsDataTable } from '@/components/logs/LogsDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDate, normalizeDateForComparison } from '@/utils/formatting';
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

  // Fetch logs for the selected date range
  // If no date range is selected, fetch recent logs (last 30 days as fallback)
  const apiStartDate = startDate || formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const apiEndDate = endDate || formatDate(new Date());

  const { data: allLogs = [], isLoading: logsLoading } = useMyLogs(
    undefined, 
    apiStartDate, 
    apiEndDate
  );
  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();

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

    // Apply project filter
    if (selectedProjectId) {
      filtered = filtered.filter((log) => log.project_id === selectedProjectId);
    }

    return filtered;
  }, [allLogs, dateRange, selectedProjectId]);

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
