import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StarRating } from './StarRating';
import { useSubmitFeedback } from '@/lib/query/hooks/useFeedback';
import { useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/lib/api/types';

export function GiveFeedbackForm() {
  const { user, isAdmin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Admins fetch all users (teamId null), members fetch own team
  const teamId = isAdmin ? null : (user?.team_id ?? null);
  // Pass true to always enable query; teamId already scopes to correct team
  const { data: allUsers = [] } = useUsersByTeam(teamId, true);

  const eligibleRecipients = allUsers.filter((u: User) => u.id !== user?.id && u.is_active);

  const submitMutation = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !content.trim()) return;
    try {
      await submitMutation.mutateAsync({
        to_user_id: selectedUserId,
        content: content.trim(),
        rating: rating ?? undefined,
      });
      setSelectedUserId(null);
      setContent('');
      setRating(null);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (_) {
      // error shown below
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient</Label>
        <select
          id="recipient"
          value={selectedUserId ?? ''}
          onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          <option value="">Select a team member...</option>
          {eligibleRecipients.map((u: User) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Feedback</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your feedback here... This will be anonymous."
          rows={5}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Rating <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <StarRating value={rating} onChange={setRating} />
        {rating !== null && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setRating(null)}
          >
            Clear rating
          </button>
        )}
      </div>

      {submitMutation.isError && (
        <p className="text-sm text-destructive">
          {(submitMutation.error as Error)?.message || 'Failed to submit feedback. Try again.'}
        </p>
      )}

      {submitted && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Feedback submitted anonymously.
        </p>
      )}

      <Button type="submit" disabled={!selectedUserId || !content.trim() || submitMutation.isPending}>
        {submitMutation.isPending ? (
          <><LoadingSpinner size="sm" className="mr-2" />Submitting...</>
        ) : (
          'Submit Anonymously'
        )}
      </Button>
    </form>
  );
}
