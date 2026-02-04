/**
 * Messages Page
 *
 * Main page for team 1-to-1 messaging feature.
 * Displays conversation list and message thread side by side.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { IconMessage, IconMessagePlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import type { RootState } from '@/store/store';
import { setActiveConversation } from '@/store/slices/teamChatSlice';
import { useConversations } from '@/lib/query/hooks/useTeamChat';
import { useTeamChatSSE } from '@/lib/hooks/useTeamChatSSE';
import {
  ConversationList,
  MessageThread,
  NewConversationDialog,
} from '@/components/team-chat';

export function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  const activeConversationId = useSelector(
    (state: RootState) => state.teamChat.activeConversationId
  );

  // Fetch conversations (loading state handled by ConversationList)
  useConversations();

  // Connect to SSE for real-time updates
  useTeamChatSSE(true);

  // Sync URL param to Redux on mount or URL change
  useEffect(() => {
    if (conversationId) {
      const id = parseInt(conversationId, 10);
      if (!isNaN(id)) {
        dispatch(setActiveConversation(id));
      }
    }
  }, [conversationId, dispatch]);

  // Update URL when active conversation changes (only if different from URL)
  useEffect(() => {
    if (!activeConversationId) return;

    const urlId = conversationId ? parseInt(conversationId, 10) : null;
    if (urlId !== activeConversationId) {
      navigate(`/messages/${activeConversationId}`, { replace: true });
    }
  }, [activeConversationId, navigate]); // Removed conversationId from deps to break the cycle

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversation List Sidebar */}
      <div className="w-80 border-r flex-shrink-0 hidden md:block">
        <ConversationList onNewConversation={() => setIsNewConversationOpen(true)} />
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <MessageThread conversationId={activeConversationId} />
        ) : (
          <EmptyState onNewConversation={() => setIsNewConversationOpen(true)} />
        )}
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
      />
    </div>
  );
}

interface EmptyStateProps {
  onNewConversation: () => void;
}

function EmptyState({ onNewConversation }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <IconMessage className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">Team Messages</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Send private messages to your team members. Start a conversation to collaborate,
        share updates, or just say hello.
      </p>

      <Button onClick={onNewConversation}>
        <IconMessagePlus className="w-4 h-4 mr-2" />
        Start a Conversation
      </Button>
    </div>
  );
}

export default MessagesPage;
