import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectProgressBar } from './ProjectProgressBar';
import type { Project } from '@/lib/api/types';

interface ProjectProgressSummaryProps {
  projects: Project[];
}

/**
 * Renders a compact list of every project that has progress tracking enabled
 * and a non-zero estimate. Hidden entirely when no projects qualify so it
 * never adds visual noise on pages where the feature isn't in use.
 */
export function ProjectProgressSummary({ projects }: ProjectProgressSummaryProps) {
  const trackedProjects = projects.filter(
    (project) =>
      project.progress_tracking_enabled &&
      project.estimated_hours !== null &&
      project.estimated_hours > 0
  );

  if (trackedProjects.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackedProjects.map((project) => (
            <div key={project.id} className="space-y-2">
              <p className="text-sm font-medium truncate">{project.name}</p>
              <ProjectProgressBar
                trackedHours={project.tracked_hours_total}
                estimatedHours={project.estimated_hours as number}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
