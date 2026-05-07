import { useState } from 'react';
import { GiveFeedbackForm } from '@/components/feedback/GiveFeedbackForm';
import { ReceivedFeedbackList } from '@/components/feedback/ReceivedFeedbackList';
import { useFeedbackUnreadCount } from '@/lib/query/hooks/useFeedback';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tab = 'give' | 'received';

export function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<Tab>('give');
  const { data: unreadCount = 0 } = useFeedbackUnreadCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Give anonymous feedback to teammates. Received feedback is fully anonymous.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {(['give', 'received'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'give' ? 'Give Feedback' : 'Received'}
            {tab === 'received' && unreadCount > 0 && (
              <Badge variant="default" className="text-xs h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {activeTab === 'give' && (
          <div className="max-w-lg">
            <GiveFeedbackForm />
          </div>
        )}
        {activeTab === 'received' && (
          <div className="max-w-2xl">
            <ReceivedFeedbackList />
          </div>
        )}
      </div>
    </div>
  );
}
