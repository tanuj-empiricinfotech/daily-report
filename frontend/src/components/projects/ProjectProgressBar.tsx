import { cn } from '@/lib/utils';

interface ProjectProgressBarProps {
  trackedHours: number;
  estimatedHours: number;
  className?: string;
}

const PERCENT_FULL = 100;
const HOURS_DECIMAL_PLACES = 1;

function formatHours(value: number): string {
  return value.toFixed(HOURS_DECIMAL_PLACES);
}

/**
 * Visualises a project's tracked-vs-estimated hours as a progress bar.
 *
 * - Fills proportionally up to the estimate.
 * - When tracked hours exceed the estimate, the bar fills completely and
 *   turns red, and the label calls out how many hours over budget the
 *   project is.
 */
export function ProjectProgressBar({
  trackedHours,
  estimatedHours,
  className,
}: ProjectProgressBarProps) {
  const isOverBudget = trackedHours > estimatedHours;
  const overBy = trackedHours - estimatedHours;

  // Cap the visual fill at 100% — anything above the estimate is conveyed by
  // the colour change rather than overflowing the track.
  const fillPercent =
    estimatedHours <= 0
      ? 0
      : Math.min((trackedHours / estimatedHours) * PERCENT_FULL, PERCENT_FULL);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {formatHours(trackedHours)}h / {formatHours(estimatedHours)}h
        </span>
        {isOverBudget && (
          <span className="font-medium text-destructive">
            Over by {formatHours(overBy)}h
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(fillPercent)}
        aria-valuemin={0}
        aria-valuemax={PERCENT_FULL}
      >
        <div
          className={cn(
            'h-full transition-all',
            isOverBudget ? 'bg-destructive' : 'bg-primary'
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
