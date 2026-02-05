/**
 * Message Thread Component
 *
 * Displays messages in a conversation with virtualization, reply support,
 * and infinite scroll.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  IconUser,
  IconRobot,
  IconSend,
  IconGhost,
  IconGhostOff,
  IconLoader2,
  IconArrowBackUp,
  IconX,
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
import {
  setDraft,
  setReplyingTo,
  clearReplyingTo,
  type Message,
} from '@/store/slices/teamChatSlice';
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
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMarkedAsReadMessageIdRef = useRef<number | null>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const conversation = useSelector((state: RootState) =>
    state.teamChat.conversations.find((c) => c.id === conversationId)
  );

  const messagesState = useSelector(
    (state: RootState) => state.teamChat.messagesByConversation[conversationId]
  );

  const draft = useSelector(
    (state: RootState) => state.teamChat.drafts[conversationId] || ''
  );

  const replyingTo = useSelector(
    (state: RootState) => state.teamChat.replyingTo[conversationId]
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

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated message height
    overscan: 5,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, isAtBottom, virtualizer]);

  // Reset mark as read ref when conversation changes
  useEffect(() => {
    lastMarkedAsReadMessageIdRef.current = null;
  }, [conversationId]);

  // Mark messages as read when viewing
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
  ]);

  // Handle scroll for infinite loading and bottom detection
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;

    // Check if at bottom
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);

    // Load more when near top
    if (scrollTop < 100 && hasMore && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  // Scroll to a specific message
  const scrollToMessage = useCallback((messageId: number) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
      // Highlight the message briefly
      setTimeout(() => {
        const element = messageRefs.current.get(messageId);
        if (element) {
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 300);
    }
  }, [messages, virtualizer]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;

    const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    sendMessageMutation.mutate({
      conversationId,
      content,
      localId,
      replyToMessageId: replyingTo?.id,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        sender_id: replyingTo.sender_id,
        sender_name: replyingTo.sender_name || 'Unknown',
      } : undefined,
    });

    // Clear reply state after sending
    if (replyingTo) {
      dispatch(clearReplyingTo(conversationId));
    }
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

  const handleReply = (message: Message) => {
    dispatch(setReplyingTo({ conversationId, message }));
  };

  const handleCancelReply = () => {
    dispatch(clearReplyingTo(conversationId));
  };

  // Nudge feature - double click on empty space sends 👉🏻
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on the container itself, not on message bubbles
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-message-bubble]') ||
      target.closest('button') ||
      target.closest('textarea')
    ) {
      return;
    }

    const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sendMessageMutation.mutate({
      conversationId,
      content: '👉🏻',
      localId,
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

      {/* Messages with Virtualization */}
      <div
        className="flex-1 overflow-y-auto"
        ref={parentRef}
        onScroll={handleScroll}
        onDoubleClick={handleDoubleClick}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <IconRobot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const message = messages[virtualItem.index];
              const isOwn = message.sender_id === user?.id || message.status === 'pending';

              return (
                <div
                  key={message.local_id || message.id}
                  data-index={virtualItem.index}
                  ref={(el) => {
                    virtualizer.measureElement(el);
                    if (el && message.id > 0) {
                      messageRefs.current.set(message.id, el);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="p-2"
                >
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    onReply={() => handleReply(message)}
                    onReplyClick={scrollToMessage}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 pt-2 border-t bg-muted/30">
          <div className="flex items-start gap-2 p-2 rounded bg-muted/50">
            <IconArrowBackUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Replying to {replyingTo.sender_name || 'Unknown'}
              </p>
              <p className="text-sm truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleCancelReply}
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
            className="h-[44px] w-[44px] shrink-0"
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
  onReply: () => void;
  onReplyClick: (messageId: number) => void;
}

function MessageBubble({ message, isOwn, onReply, onReplyClick }: MessageBubbleProps) {
  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn('flex group', isOwn ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-end gap-1 max-w-[75%]">
        {/* Reply button (left side for own messages) */}
        {isOwn && showActions && !isPending && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onReply}
              >
                <IconArrowBackUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
        )}

        <div
          data-message-bubble
          className={cn(
            'rounded-2xl px-4 py-2 transition-all',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm',
            isPending && 'opacity-70',
            isFailed && 'border border-destructive'
          )}
        >
          {/* Reply preview */}
          {message.reply_to && (
            <button
              onClick={() => onReplyClick(message.reply_to!.id)}
              className={cn(
                'w-full text-left mb-2 p-2 rounded border-l-2 transition-colors',
                isOwn
                  ? 'bg-primary-foreground/10 border-primary-foreground/50 hover:bg-primary-foreground/20'
                  : 'bg-background/50 border-primary/50 hover:bg-background/70'
              )}
            >
              <p className={cn(
                'text-xs font-medium',
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {message.reply_to.sender_name}
              </p>
              <p className={cn(
                'text-sm truncate',
                isOwn ? 'text-primary-foreground/80' : 'text-foreground/80'
              )}>
                {message.reply_to.content}
              </p>
            </button>
          )}

          {!isOwn && message.sender_name && !message.reply_to && (
            <p className="text-xs font-medium mb-1">{message.sender_name}</p>
          )}

          <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>

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

        {/* Reply button (right side for others' messages) */}
        {!isOwn && showActions && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onReply}
              >
                <IconArrowBackUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export default MessageThread;
