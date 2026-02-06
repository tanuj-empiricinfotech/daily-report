/**
 * ChatBox Component
 *
 * In-game chat/guess input with message display.
 */

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconSend } from '@tabler/icons-react';
import type { GameChatMessage } from '../types/game.types';

interface ChatBoxProps {
  /** Messages to display */
  messages: GameChatMessage[];
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Called when a message is submitted */
  onSendMessage: (message: string) => void;
  /** Auto-scroll to bottom on new messages */
  autoScroll?: boolean;
  /** Maximum height */
  maxHeight?: number | string;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Get message style based on type
 */
function getMessageStyle(type: GameChatMessage['type']): string {
  switch (type) {
    case 'correct':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'close':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'system':
      return 'bg-muted text-muted-foreground italic';
    default:
      return '';
  }
}

export function ChatBox({
  messages,
  placeholder = 'Type your guess...',
  disabled = false,
  onSendMessage,
  autoScroll = true,
  maxHeight = 300,
  showTimestamps = false,
  className,
}: ChatBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !disabled) {
        onSendMessage(trimmed);
        setInputValue('');
        inputRef.current?.focus();
      }
    },
    [inputValue, disabled, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed && !disabled) {
          onSendMessage(trimmed);
          setInputValue('');
        }
      }
    },
    [inputValue, disabled, onSendMessage]
  );

  return (
    <div className={cn('flex flex-col rounded-lg border bg-background', className)}>
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                showTimestamp={showTimestamps}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={disabled || !inputValue.trim()}>
          <IconSend className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

/**
 * Individual chat message
 */
interface ChatMessageProps {
  message: GameChatMessage;
  showTimestamp?: boolean;
}

function ChatMessage({ message, showTimestamp }: ChatMessageProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'rounded px-2 py-1 text-sm',
        getMessageStyle(message.type)
      )}
    >
      <div className="flex items-baseline gap-1">
        {message.type === 'system' ? (
          <span>{message.content}</span>
        ) : (
          <>
            <span className="font-medium">{message.playerName}:</span>
            <span>{message.content}</span>
          </>
        )}
        {showTimestamp && (
          <span className="ml-auto text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact chat display (read-only)
 */
interface ChatDisplayProps {
  messages: GameChatMessage[];
  maxMessages?: number;
  maxHeight?: number | string;
  className?: string;
}

export function ChatDisplay({
  messages,
  maxMessages = 50,
  maxHeight = 200,
  className,
}: ChatDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayMessages = messages.slice(-maxMessages);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className={cn('overflow-y-auto rounded-lg bg-muted/30 p-2', className)}
      style={{ maxHeight }}
    >
      {displayMessages.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground">
          No messages yet
        </div>
      ) : (
        <div className="space-y-1">
          {displayMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
