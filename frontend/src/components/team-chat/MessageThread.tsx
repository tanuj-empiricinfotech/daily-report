/**
 * Message Thread Component
 *
 * Displays messages in a conversation with infinite scroll and composer.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconUser,
  IconRobot,
  IconSend,
  IconGhost,
  IconGhostOff,
  IconLoader2,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RootState } from '@/store/store';
import { setDraft, type Message } from '@/store/slices/teamChatSlice';
import {
  useMessages,
  useSendMessage,
  useUpdateVanishingMode,
  useMarkAsRead,
} from '@/lib/query/hooks/useTeamChat';
import { useAuth } from '@/hooks/useAuth';

interface MessageThreadProps {
  conversationId: number;
  className?: string;
}

export function MessageThread({ conversationId, className }: MessageThreadProps) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMarkedAsReadMessageIdRef = useRef<number | null>(null);

  const conversation = useSelector((state: RootState) =>
    state.teamChat.conversations.find((c) => c.id === conversationId)
  );

  const messagesState = useSelector(
    (state: RootState) => state.teamChat.messagesByConversation[conversationId]
  );

  const draft = useSelector(
    (state: RootState) => state.teamChat.drafts[conversationId] || ''
  );

  const { fetchNextPage, isFetchingNextPage } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const updateVanishingModeMutation = useUpdateVanishingMode();
  const markAsReadMutation = useMarkAsRead();

  const messages = messagesState?.messages || [];
  const hasMore = messagesState?.hasMore ?? true;
  const lastMessage = messages[messages.length - 1];
  const lastMessageId = lastMessage?.id;
  const lastMessageSenderId = lastMessage?.sender_id;
  const lastMessageReadAt = lastMessage?.read_at;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isAtBottom]);

  // Mark messages as read when viewing
  useEffect(() => {
    lastMarkedAsReadMessageIdRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (!lastMessageId || !user?.id) return;
    if (lastMessageSenderId === user.id) return;
    if (lastMessageReadAt) return;

    if (lastMarkedAsReadMessageIdRef.current === lastMessageId) return;
    lastMarkedAsReadMessageIdRef.current = lastMessageId;

    markAsReadMutation.mutate({
      conversationId,
      upToMessageId: lastMessageId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversationId,
    lastMessageId,
    lastMessageSenderId,
    lastMessageReadAt,
    user?.id,
    // markAsReadMutation excluded - stable function, including causes infinite loop
  ]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Check if at bottom
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);

      // Load more when near top
      if (scrollTop < 100 && hasMore && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasMore, isFetchingNextPage, fetchNextPage]
  );

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;

    const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    sendMessageMutation.mutate({
      conversationId,
      content,
      localId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleVanishingMode = () => {
    if (!conversation) return;

    updateVanishingModeMutation.mutate({
      conversationId,
      vanishingMode: !conversation.vanishing_mode,
    });
  };

  if (!conversation) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <IconUser className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {conversation.other_participant_name || 'Unknown User'}
            </h3>
            {conversation.vanishing_mode && (
              <p className="text-xs text-amber-600">
                Vanishing mode ({conversation.vanishing_duration_hours}h)
              </p>
            )}
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVanishingMode}
              disabled={updateVanishingModeMutation.isPending}
            >
              {conversation.vanishing_mode ? (
                <IconGhostOff className="h-5 w-5 text-amber-600" />
              ) : (
                <IconGhost className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {conversation.vanishing_mode
              ? 'Disable vanishing mode'
              : 'Enable vanishing mode (messages delete after 24h)'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Messages */}
      <div
        className="flex-1 p-4 overflow-y-auto"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <IconRobot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.local_id || message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-4 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message..."
            value={draft}
            onChange={(e) =>
              dispatch(setDraft({ conversationId, content: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
            onClick={handleSend}
            disabled={!draft.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconSend className="h-4 w-4" />
            )}
          </Button>
        </div>

        {conversation.vanishing_mode && (
          <p className="text-xs text-amber-600 mt-2">
            Messages will disappear after {conversation.vanishing_duration_hours} hours
          </p>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm',
          isPending && 'opacity-70',
          isFailed && 'border border-destructive'
        )}
      >
        {!isOwn && message.sender_name && (
          <p className="text-xs font-medium mb-1">{message.sender_name}</p>
        )}

        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          <span>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {message.is_vanishing && (
            <IconGhost className="h-3 w-3" />
          )}

          {isPending && <span>Sending...</span>}
          {isFailed && <span className="text-destructive">Failed to send</span>}
        </div>
      </div>
    </div>
  );
}

export default MessageThread;
