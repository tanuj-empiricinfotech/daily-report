/**
 * Chat Thread Component
 *
 * Main chat interface using assistant-ui with AI SDK integration.
 * Handles message display, composition, and streaming responses.
 */

import { useMemo } from 'react';
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessagePartText,
  ActionBarPrimitive,
} from '@assistant-ui/react';
import { useChatRuntime, AssistantChatTransport } from '@assistant-ui/react-ai-sdk';
import { IconSend, IconUser, IconRobot, IconCopy, IconCheck, IconRefresh } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ChatContextOptions } from '@/lib/api/types';
import { useState } from 'react';

interface ChatThreadProps {
  apiEndpoint: string;
  context?: ChatContextOptions;
  className?: string;
}

/**
 * Main Chat Thread Component
 * Wraps the assistant-ui thread with custom styling and configuration
 */
export function ChatThread({ apiEndpoint, context, className }: ChatThreadProps) {
  // Create transport with context in the request body
  const transport = useMemo(() => {
    return new AssistantChatTransport({
      api: apiEndpoint,
      credentials: 'include',
      body: context ? { context } : undefined,
    });
  }, [apiEndpoint, context]);

  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={cn('flex flex-col h-full', className)}>
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}

/**
 * Thread Component
 * Displays messages and composer
 */
function Thread() {
  return (
    <ThreadPrimitive.Root className="flex flex-col h-full">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
        <ThreadPrimitive.Empty>
          <EmptyState />
        </ThreadPrimitive.Empty>
      </ThreadPrimitive.Viewport>
      <Composer />
    </ThreadPrimitive.Root>
  );
}

/**
 * Empty State Component
 * Shown when no messages exist yet
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <IconRobot className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Chat with your work logs</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Ask questions about your logged work, get summaries, analyze patterns,
        or generate reports from your daily logs.
      </p>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <SuggestedPrompt text="Summarize my work this week" />
        <SuggestedPrompt text="What projects did I spend the most time on?" />
        <SuggestedPrompt text="Generate a weekly report" />
      </div>
    </div>
  );
}

/**
 * Suggested Prompt Component
 */
function SuggestedPrompt({ text }: { text: string }) {
  return (
    <div className="px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
      {text}
    </div>
  );
}

/**
 * User Message Component
 */
function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3 p-4 justify-end">
      <div className="flex flex-col items-end max-w-[80%]">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
          <MessagePrimitive.Content />
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <IconUser className="w-4 h-4" />
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Assistant Message Component
 */
function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3 p-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <IconRobot className="w-4 h-4 text-primary" />
      </div>
      <div className="flex flex-col max-w-[80%]">
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
          <MessagePrimitive.Content
            components={{
              Text: TextPart,
            }}
          />
        </div>
        <AssistantMessageActions />
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Text Part Component
 * Renders text content with markdown support
 */
function TextPart() {
  const partText = useMessagePartText();
  // Handle the case where partText might be an object with a text property
  const text = typeof partText === 'string' ? partText : (partText as { text?: string })?.text || '';
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <MarkdownContent content={text} />
    </div>
  );
}

/**
 * Simple Markdown Renderer
 * Handles basic markdown formatting
 */
function MarkdownContent({ content }: { content: string }) {
  // Split content into paragraphs and render with basic formatting
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, index) => {
        // Handle headers
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
        }
        // Handle list items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-2 ml-2">
              <span className="text-muted-foreground">•</span>
              <span>{formatInlineMarkdown(line.slice(2))}</span>
            </div>
          );
        }
        // Handle numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-2 ml-2">
              <span className="text-muted-foreground min-w-[1.5rem]">{numberedMatch[1]}.</span>
              <span>{formatInlineMarkdown(line.slice(numberedMatch[0].length))}</span>
            </div>
          );
        }
        // Handle empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        // Regular paragraph
        return <p key={index} className="my-1">{formatInlineMarkdown(line)}</p>;
      })}
    </>
  );
}

/**
 * Format inline markdown (bold, italic, code)
 */
function formatInlineMarkdown(text: string): React.ReactNode {
  // Simple regex-based formatting - could be enhanced with a proper markdown parser
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Handle code blocks
  const codeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <code key={key++} className="bg-muted-foreground/20 px-1 py-0.5 rounded text-sm">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Assistant Message Actions
 * Copy, regenerate, etc.
 */
function AssistantMessageActions() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <ActionBarPrimitive.Root>
        <ActionBarPrimitive.Copy
          onClick={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {copied ? (
              <IconCheck className="h-3 w-3 text-green-500" />
            ) : (
              <IconCopy className="h-3 w-3" />
            )}
          </Button>
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.Reload>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <IconRefresh className="h-3 w-3" />
          </Button>
        </ActionBarPrimitive.Reload>
      </ActionBarPrimitive.Root>
    </div>
  );
}

/**
 * Composer Component
 * Message input with send button
 */
function Composer() {
  return (
    <ComposerPrimitive.Root className="border-t p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <ComposerPrimitive.Input
          placeholder="Ask about your work logs..."
          className="flex-1 min-h-[44px] max-h-[200px] resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
        <ComposerPrimitive.Send asChild>
          <Button size="icon" className="h-[44px] w-[44px] rounded-xl">
            <IconSend className="h-4 w-4" />
          </Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
}

export default ChatThread;
