/**
 * GameLayout Component
 *
 * Standard layout wrapper for active games with sidebar, header, and main area.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Timer } from './Timer';
import { MiniScoreBoard } from './ScoreBoard';
import { LobbyHeader } from './GameLobby';
import type { Player } from '../types/game.types';

interface GameLayoutProps {
  /** Room code */
  roomCode: string;
  /** Players list */
  players: Player[];
  /** Max players */
  maxPlayers: number;
  /** Current user ID */
  currentUserId?: number;
  /** Active player ID (drawing, etc.) */
  activePlayerId?: number;
  /** Time remaining (seconds) */
  timeRemaining?: number;
  /** Total time for the round */
  totalTime?: number;
  /** Current round number */
  currentRound?: number;
  /** Total rounds */
  totalRounds?: number;
  /** Status text to display */
  statusText?: string;
  /** Main game content */
  children: ReactNode;
  /** Sidebar content (below scoreboard) */
  sidebarContent?: ReactNode;
  /** Header content (additional controls) */
  headerContent?: ReactNode;
  /** Called when leaving the game */
  onLeave: () => void;
  /** Custom class name */
  className?: string;
}

export function GameLayout({
  roomCode,
  players,
  maxPlayers,
  currentUserId,
  activePlayerId,
  timeRemaining,
  totalTime,
  currentRound,
  totalRounds,
  statusText,
  children,
  sidebarContent,
  headerContent,
  onLeave,
  className,
}: GameLayoutProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <header className="shrink-0 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between">
          <LobbyHeader
            roomCode={roomCode}
            playerCount={players.length}
            maxPlayers={maxPlayers}
            onLeave={onLeave}
          />

          {/* Round info */}
          {currentRound !== undefined && totalRounds !== undefined && (
            <div className="text-sm font-medium">
              Round {currentRound} / {totalRounds}
            </div>
          )}

          {/* Timer */}
          {timeRemaining !== undefined && totalTime !== undefined && (
            <Timer
              duration={totalTime}
              timeRemaining={timeRemaining}
              size="sm"
              showProgress={false}
            />
          )}

          {headerContent}
        </div>

        {/* Status text */}
        {statusText && (
          <div className="mt-1 text-center text-sm text-muted-foreground">
            {statusText}
          </div>
        )}
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main game area */}
        <main className="flex-1 overflow-auto p-4">{children}</main>

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-l bg-muted/30 p-4 lg:block">
          <div className="space-y-4">
            {/* Scoreboard */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Scoreboard
              </h3>
              <MiniScoreBoard
                players={players}
                currentUserId={currentUserId}
                activePlayerId={activePlayerId}
              />
            </div>

            {/* Additional sidebar content */}
            {sidebarContent}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Simple centered game layout for games without sidebar
 */
interface CenteredGameLayoutProps {
  children: ReactNode;
  /** Optional header content */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Max width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function CenteredGameLayout({
  children,
  header,
  footer,
  maxWidth = 'lg',
  className,
}: CenteredGameLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('flex min-h-full flex-col', className)}>
      {header && <div className="shrink-0">{header}</div>}

      <div className="flex flex-1 items-center justify-center p-4">
        <div className={cn('w-full', maxWidthClasses[maxWidth])}>{children}</div>
      </div>

      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  );
}

/**
 * Full-screen game layout for canvas-based games
 */
interface FullScreenGameLayoutProps {
  children: ReactNode;
  /** Overlay elements (timer, score, etc.) */
  overlay?: ReactNode;
  /** Bottom bar content */
  bottomBar?: ReactNode;
  className?: string;
}

export function FullScreenGameLayout({
  children,
  overlay,
  bottomBar,
  className,
}: FullScreenGameLayoutProps) {
  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      {/* Main game area */}
      <div className="relative flex-1 overflow-hidden">{children}</div>

      {/* Overlay */}
      {overlay && (
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto">{overlay}</div>
        </div>
      )}

      {/* Bottom bar */}
      {bottomBar && (
        <div className="shrink-0 border-t bg-background/95 backdrop-blur">
          {bottomBar}
        </div>
      )}
    </div>
  );
}
