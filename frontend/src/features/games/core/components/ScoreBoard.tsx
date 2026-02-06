/**
 * ScoreBoard Component
 *
 * Displays player scores in a leaderboard format.
 */

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerList } from './PlayerCard';
import type { Player } from '../types/game.types';

interface ScoreBoardProps {
  /** List of players */
  players: Player[];
  /** Current user's ID */
  currentUserId?: number;
  /** Host player ID */
  hostId?: number;
  /** Currently active player (drawing, etc.) */
  activePlayerId?: number;
  /** Title to display */
  title?: string;
  /** Show rank numbers */
  showRanks?: boolean;
  /** Maximum players to show (with "show more" option) */
  maxVisible?: number;
  /** Visual variant */
  variant?: 'card' | 'inline';
  /** Custom class name */
  className?: string;
}

export function ScoreBoard({
  players,
  currentUserId,
  hostId,
  activePlayerId,
  title = 'Scoreboard',
  showRanks = true,
  maxVisible,
  variant = 'card',
  className,
}: ScoreBoardProps) {
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const displayPlayers = maxVisible
    ? sortedPlayers.slice(0, maxVisible)
    : sortedPlayers;
  const hiddenCount = maxVisible ? Math.max(0, sortedPlayers.length - maxVisible) : 0;

  const content = (
    <>
      <PlayerList
        players={displayPlayers}
        currentUserId={currentUserId}
        hostId={hostId}
        activePlayerId={activePlayerId}
        showScore={true}
        showRanks={showRanks}
        variant="compact"
      />
      {hiddenCount > 0 && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          +{hiddenCount} more players
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

/**
 * Mini scoreboard for compact display during gameplay
 */
interface MiniScoreBoardProps {
  players: Player[];
  currentUserId?: number;
  activePlayerId?: number;
  className?: string;
}

export function MiniScoreBoard({
  players,
  currentUserId,
  activePlayerId,
  className,
}: MiniScoreBoardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className={cn('space-y-1', className)}>
      {sortedPlayers.map((player, index) => {
        const isCurrentUser = player.id === currentUserId;
        const isActive = player.id === activePlayerId;

        return (
          <div
            key={player.id}
            className={cn(
              'flex items-center justify-between rounded px-2 py-1 text-sm',
              isActive && 'bg-primary/10',
              isCurrentUser && !isActive && 'bg-muted/50'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 text-xs text-muted-foreground">{index + 1}</span>
              <span className={cn('truncate', isCurrentUser && 'font-medium')}>
                {player.name}
              </span>
            </div>
            <span className="font-mono font-medium">{player.score}</span>
          </div>
        );
      })}
    </div>
  );
}
