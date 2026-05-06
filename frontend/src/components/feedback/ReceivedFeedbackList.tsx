import { useFeedbackReceived } from '@/lib/query/hooks/useFeedback';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { IconLock } from '@tabler/icons-react';

export function ReceivedFeedbackList() {
  const { data: feedback = [], isLoading } = useFeedbackReceived();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <IconLock className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>No feedback received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        <IconLock className="h-3.5 w-3.5" />
        All feedback is anonymous — sender identities are never shown.
      </p>

      {feedback.map((item) => (
        <Card key={item.id} className={item.is_read ? '' : 'border-primary/50'}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
                {!item.is_read && (
                  <Badge variant="default" className="text-xs px-1.5 py-0">New</Badge>
                )}
              </div>
              {item.rating !== null && (
                <StarRating value={item.rating} readonly size="sm" />
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
