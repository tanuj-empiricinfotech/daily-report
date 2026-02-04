import { AxiosError } from 'axios';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface ApiErrorResponse {
  success: boolean;
  message: string;
}

interface ErrorDisplayProps {
  error: string | Error | null;
  className?: string;
}

function getErrorMessage(error: string | Error): string {
  if (typeof error === 'string') {
    return error;
  }

  // Handle Axios errors - extract the API response message
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    if (data.message) {
      return data.message;
    }
  }

  // Fallback to generic error message
  return error.message;
}

export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = getErrorMessage(error);

  return (
    <Card className={cn('border-destructive', className)}>
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </CardContent>
    </Card>
  );
}

