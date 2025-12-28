import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: string | Error | null;
  className?: string;
}

export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className={cn('border-destructive', className)}>
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </CardContent>
    </Card>
  );
}

