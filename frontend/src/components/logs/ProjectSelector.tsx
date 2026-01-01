import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserAssignments } from '@/lib/query/hooks/useAssignments';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/lib/query/hooks/useProjects';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

interface ProjectSelectorProps {
  value: number | null;
  onChange: (projectId: number) => void;
  error?: string;
}

export function ProjectSelector({ value, onChange, error }: ProjectSelectorProps) {
  const { user } = useAuth();
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const { data: projects = [] } = useProjects(selectedTeamId);
  const { data: assignments = [] } = useUserAssignments(user?.id || null);

  const assignedProjectIds = new Set(assignments.map((a) => a.project_id));
  const availableProjects = projects.filter((p) => assignedProjectIds.has(p.id));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Project</label>
      <Select
        value={value?.toString() || ''}
        onValueChange={(val) => onChange(parseInt(val, 10))}
      >
        <SelectTrigger className={error ? 'aria-invalid' : ''}>
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {availableProjects.map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

