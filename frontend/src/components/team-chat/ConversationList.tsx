/**
 * Conversation List Component
 *
 * Displays list of conversations with search and new conversation button.
 */

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconSearch, IconMessagePlus, IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RootState } from '@/store/store';
import { setActiveConversation, type Conversation } from '@/store/slices/teamChatSlice';

// Format time relative to now
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

interface ConversationListProps {
  onNewConversation: () => void;
  className?: string;
}

export function ConversationList({ onNewConversation, className }: ConversationListProps) {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');

  const { conversations, activeConversationId, conversationsLoading } = useSelector(
    (state: RootState) => state.teamChat
  );

  const filteredConversations = conversations.filter((conversation) =>
    conversation.other_participant_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (conversationId: number) => {
    dispatch(setActiveConversation(conversationId));
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            title="New conversation"
          >
            <IconMessagePlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversationsLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => handleSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const unreadCount = conversation.unread_count || 0;
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left relative',
        isActive && 'bg-muted',
        hasUnread && !isActive && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
        hasUnread ? 'bg-primary/20' : 'bg-primary/10'
      )}>
        <IconUser className={cn('w-5 h-5', hasUnread ? 'text-primary' : 'text-primary')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium truncate', hasUnread && 'font-semibold')}>
            {conversation.other_participant_name || 'Unknown User'}
          </span>
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatRelativeTime(new Date(conversation.last_message_at))}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {conversation.last_message_preview || 'No messages yet'}
          </p>

          {hasUnread && (
            <Badge variant="default" className="flex-shrink-0 h-5 min-w-[20px] px-1.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>

        {/* Vanishing mode indicator */}
        {conversation.vanishing_mode && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Vanishing mode</span>
          </div>
        )}
      </div>
    </button>
  );
}

export default ConversationList;
