import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveFeedbackForm } from '@/components/feedback/GiveFeedbackForm';
import { ReceivedFeedbackList } from '@/components/feedback/ReceivedFeedbackList';
import { useFeedbackUnreadCount } from '@/lib/query/hooks/useFeedback';
import { Badge } from '@/components/ui/badge';

export function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('give');
  const { data: unreadCount = 0 } = useFeedbackUnreadCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Give anonymous feedback to teammates. Received feedback is fully anonymous.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="give">Give Feedback</TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            Received
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="give" className="mt-6 max-w-lg">
          <GiveFeedbackForm />
        </TabsContent>

        <TabsContent value="received" className="mt-6 max-w-2xl">
          <ReceivedFeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
