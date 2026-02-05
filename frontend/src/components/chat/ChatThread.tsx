/**
 * Chat Thread Component
 *
 * Main chat interface using assistant-ui with AI SDK integration.
 * Handles message display, composition, and streaming responses.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store/store';
import { setDraftMessage, clearDraftMessage } from '@/store/slices/chatSlice';
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessagePartText,
  ActionBarPrimitive,
  useComposerRuntime,
  useThreadRuntime,
} from '@assistant-ui/react';
import { useChatRuntime, AssistantChatTransport } from '@assistant-ui/react-ai-sdk';
import { IconSend, IconUser, IconRobot, IconCopy, IconCheck, IconRefresh } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { ChatContextOptions } from '@/lib/api/types';

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
 * Detailed prompts for suggested actions
 */
const WEEKLY_SUMMARY_PROMPT = `Summarize my work from this week based on my work logs.

Please provide a comprehensive summary that includes:

## Work Overview
- Total time logged and how it was distributed
- Main focus areas and priorities

## Accomplishments
- Key tasks completed
- Milestones reached
- Problems solved

## Project Breakdown
- Time spent per project
- Progress made on each project
- Notable contributions

## Collaboration & Communication
- Meetings attended
- Team interactions
- Any blockers or dependencies on others

## Looking Ahead
- Work in progress that will carry over
- Upcoming priorities based on current trajectory

Format the response in a clear, readable structure that I could share with my manager or team.`;

const PROJECT_TIME_ANALYSIS_PROMPT = `Analyze which projects I spent the most time on based on my work logs.

Please provide a detailed breakdown including:

## Time Distribution Overview
- Rank projects by total time invested
- Show percentage breakdown of time allocation
- Visualize with a simple text-based chart if possible

## Per-Project Analysis
For each significant project:
- Total hours/time logged
- Types of tasks performed (development, meetings, research, debugging, etc.)
- Peak activity periods
- Average daily time spent

## Insights & Patterns
- Which projects are consuming the most effort?
- Are there any projects with disproportionate time investment?
- Time trends (increasing/decreasing focus on certain projects)

## Efficiency Observations
- Projects with high meeting-to-work ratios
- Context switching patterns between projects
- Recommendations for time optimization

Present the data in a clear, analytical format with concrete numbers and percentages where available.`;

const WEEKLY_REPORT_PROMPT = `Generate a professional weekly report based on my work logs.

Create a polished, stakeholder-ready report in **markdown format** with the following structure:

## Weekly Status Report
**Week of:** [Date Range]
**Prepared by:** [Name from logs]

---

## Executive Summary
A 2-3 sentence high-level overview of the week's accomplishments and status.

## Key Accomplishments
- Bullet points of completed work
- Emphasize deliverables and outcomes
- Include any metrics or quantifiable results

## Projects Status

| Project | Status | Progress This Week | Notes |
|---------|--------|-------------------|-------|
| [Project] | 🟢 On Track / 🟡 At Risk / 🔴 Blocked | [Summary] | [Any blockers] |

## Time Allocation
Brief breakdown of how time was spent across projects/activities.

## Challenges & Blockers
- Any obstacles encountered
- Dependencies or waiting items
- Risks identified

## Next Week's Priorities
- Planned focus areas
- Upcoming deadlines
- Goals for the week

## Notes & Comments
Any additional context or callouts for stakeholders.

---

Make it professional, concise, and suitable for sharing with management or in team standups.`;

const CASE_STUDY_PROMPT = `Create a comprehensive case study for [PROJECT NAME] based on my work logs.

Please generate a professional case study document in **markdown format** that I can copy directly into a .md file. Structure it as follows:

## Project Overview
- Brief description of the project scope and objectives
- Timeline and key milestones from the logs

## Business Context & Impact
- What business problem was being solved?
- Who were the stakeholders and end users?
- What was the expected business value or ROI?

## Technical Challenges
- Key technical problems encountered during development
- Complexity factors and constraints
- Dependencies or integration challenges

## Solutions Implemented
- Technical approaches and architecture decisions
- Technologies, frameworks, and tools used
- Innovative solutions or workarounds developed

## Results & Outcomes
- Quantifiable results where possible (performance improvements, time saved, etc.)
- Qualitative improvements (user experience, maintainability, etc.)
- Lessons learned and best practices identified

## Key Metrics
- Time invested (from work logs)
- Features delivered
- Any measurable impact data

Please analyze my work logs to extract relevant information and present it in a polished, professional format suitable for a portfolio or stakeholder presentation.`;

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
        <SuggestedPrompt
          label="Summarize my work this week"
          prompt={WEEKLY_SUMMARY_PROMPT}
        />
        <SuggestedPrompt
          label="What projects did I spend the most time on?"
          prompt={PROJECT_TIME_ANALYSIS_PROMPT}
        />
        <SuggestedPrompt
          label="Generate a weekly report"
          prompt={WEEKLY_REPORT_PROMPT}
        />
        <SuggestedPrompt
          label="Create a case study for [Project Name]"
          prompt={CASE_STUDY_PROMPT}
        />
      </div>
    </div>
  );
}

/**
 * Suggested Prompt Component
 * Clicking sets the text in the composer input
 * @param label - Display text shown in the UI
 * @param prompt - Optional full prompt text (defaults to label if not provided)
 */
function SuggestedPrompt({ label, prompt }: { label: string; prompt?: string }) {
  const composerRuntime = useComposerRuntime();

  const handleClick = () => {
    composerRuntime.setText(prompt || label);
  };

  return (
    <div
      onClick={handleClick}
      className="px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
    >
      {label}
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
    <MessagePrimitive.Root className="flex gap-3 p-4 group">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <IconRobot className="w-4 h-4 text-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
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
 * Renders text content with full markdown support
 */
function TextPart() {
  const partText = useMessagePartText();
  // Handle the case where partText might be an object with a text property
  const text = typeof partText === 'string' ? partText : (partText as { text?: string })?.text || '';

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-table:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom table styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30">{children}</tr>
          ),
          // Custom code styling
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("block bg-muted p-3 rounded-lg overflow-x-auto text-sm font-mono", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted rounded-lg overflow-x-auto my-3">
              {children}
            </pre>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="ml-2">{children}</li>
          ),
          // Custom heading styling
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className="my-2 leading-relaxed">{children}</p>
          ),
          // Custom link styling
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,
          // Strong/bold text
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Emphasis/italic text
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Assistant Message Actions
 * Copy, regenerate, etc.
 */
function AssistantMessageActions() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <ActionBarPrimitive.Root>
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionBarPrimitive.Copy
              onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Button variant="ghost" size="icon" className="h-7 w-7">
                {copied ? (
                  <IconCheck className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <IconCopy className="h-3.5 w-3.5" />
                )}
              </Button>
            </ActionBarPrimitive.Copy>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {copied ? 'Copied!' : 'Copy message'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionBarPrimitive.Reload>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <IconRefresh className="h-3.5 w-3.5" />
              </Button>
            </ActionBarPrimitive.Reload>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Regenerate response
          </TooltipContent>
        </Tooltip>
      </ActionBarPrimitive.Root>
    </div>
  );
}

/**
 * Composer Component
 * Message input with send button
 * Handles message persistence via Redux - restores text on error and page reload
 */
function Composer() {
  const dispatch = useDispatch();
  const draftMessage = useSelector((state: RootState) => state.chat.draftMessage);
  const composerRuntime = useComposerRuntime();
  const threadRuntime = useThreadRuntime();
  const lastSentMessageRef = useRef<string>('');
  const wasRunningRef = useRef(false);
  const messageCountBeforeSendRef = useRef(0);
  const isInitializedRef = useRef(false);

  // Load draft from Redux state on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    if (draftMessage) {
      composerRuntime.setText(draftMessage);
    }
  }, [composerRuntime, draftMessage]);

  // Subscribe to composer text changes and persist to Redux
  useEffect(() => {
    const unsubscribe = composerRuntime.subscribe(() => {
      const text = composerRuntime.getState().text;
      dispatch(setDraftMessage(text));
    });

    return unsubscribe;
  }, [composerRuntime, dispatch]);

  // Subscribe to thread state changes to detect errors
  useEffect(() => {
    const unsubscribe = threadRuntime.subscribe(() => {
      const state = threadRuntime.getState();
      const isRunning = state.isRunning;

      // Detect transition from running to not running
      if (wasRunningRef.current && !isRunning && lastSentMessageRef.current) {
        const messages = state.messages;
        const lastMessage = messages[messages.length - 1];

        // Check if an assistant message was added after our user message
        // If only user message exists (or count didn't increase properly), likely an error
        const hasNewAssistantResponse =
          lastMessage?.role === 'assistant' &&
          messages.length > messageCountBeforeSendRef.current;

        if (!hasNewAssistantResponse) {
          // Error occurred - restore the message
          composerRuntime.setText(lastSentMessageRef.current);
        } else {
          // Success - clear Redux draft
          dispatch(clearDraftMessage());
        }

        // Clear stored message after handling
        lastSentMessageRef.current = '';
        messageCountBeforeSendRef.current = 0;
      }

      wasRunningRef.current = isRunning;
    });

    return unsubscribe;
  }, [threadRuntime, composerRuntime, dispatch]);

  const handleSend = () => {
    // Store the current text and message count before sending
    const currentText = composerRuntime.getState().text;
    if (currentText.trim()) {
      lastSentMessageRef.current = currentText;
      messageCountBeforeSendRef.current = threadRuntime.getState().messages.length;
    }
  };

  return (
    <ComposerPrimitive.Root className="border-t p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <ComposerPrimitive.Input
          placeholder="Ask about your work logs..."
          className="flex-1 min-h-[44px] max-h-[200px] resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
        <ComposerPrimitive.Send asChild>
          <Button
            size="icon"
            className="h-[44px] w-[44px] rounded-xl"
            onClick={handleSend}
          >
            <IconSend className="h-4 w-4" />
          </Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
}

export default ChatThread;
