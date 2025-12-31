import { useState, useMemo } from 'react';
import { LogsDataTable } from '@/components/logs/LogsDataTable';
import { LogFormModal } from '@/components/logs/LogFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDate, normalizeDateForComparison } from '@/utils/formatting';
import { useMyLogs } from '@/lib/query/hooks/useLogs';
import { useMyProjects } from '@/lib/query/hooks/useProjects';
import { IconPlus } from '@tabler/icons-react';

export function DailyLog() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Convert date range to strings for API
  const startDate = dateRange?.from ? formatDate(dateRange.from) : undefined;
  const endDate = dateRange?.to ? formatDate(dateRange.to) : undefined;

  // Fetch logs for the selected date range (for display)
  const { data: allLogs = [], isLoading: logsLoading } = useMyLogs(undefined, startDate, endDate);
  // Fetch logs for the editing date (for the modal form) when different from selected range
  const { data: editingLogs = [] } = useMyLogs(
    editingDate ? editingDate : undefined
  );
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
    // Use the start date from range, or today if no range selected
    const dateToUse = dateRange?.from ? formatDate(dateRange.from) : formatDate(new Date());
    setEditingDate(dateToUse);
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingDate(null);
    }
  };

  const handleEdit = () => {
    // Edit is handled by LogsDataTable
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingDate(null);
  };

  // Get logs for the editing date
  const logsForDate = editingDate
    ? editingLogs.length > 0
      ? editingLogs
      : allLogs.filter((log) =>
        normalizeDateForComparison(log.date) === normalizeDateForComparison(editingDate)
      )
    : [];

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
        onEdit={handleEdit}
      />

      <LogFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        date={editingDate || (dateRange?.from ? formatDate(dateRange.from) : formatDate(new Date()))}
        existingLogs={logsForDate}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
