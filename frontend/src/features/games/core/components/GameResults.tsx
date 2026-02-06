/**
 * GameResults Component
 *
 * Displays game results with final scores and winner announcement.
 */

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerList } from './PlayerCard';
import { IconTrophy, IconRefresh, IconHome, IconShare } from '@tabler/icons-react';
import type { Player, GameResult } from '../types/game.types';

interface GameResultsProps {
  /** Game result data */
  result: GameResult;
  /** Players list with final data */
  players: Player[];
  /** Current user's ID */
  currentUserId?: number;
  /** Game name for display */
  gameName?: string;
  /** Whether current user is the winner */
  isWinner?: boolean;
  /** Custom stats to display */
  stats?: Array<{ label: string; value: string | number }>;
  /** Called when play again is clicked */
  onPlayAgain?: () => void;
  /** Called when return to lobby is clicked */
  onReturnToLobby?: () => void;
  /** Called when share results is clicked */
  onShare?: () => void;
  /** Custom class name */
  className?: string;
}

export function GameResults({
  result,
  players,
  currentUserId,
  gameName = 'Game',
  isWinner = false,
  stats,
  onPlayAgain,
  onReturnToLobby,
  onShare,
  className,
}: GameResultsProps) {
  // Get winner info
  const winner = result.winnerId
    ? players.find((p) => p.id === result.winnerId)
    : null;

  // Sort players by final score
  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Find current user's rank
  const currentUserRank = rankedPlayers.findIndex((p) => p.id === currentUserId) + 1;

  return (
    <div className={cn('relative', className)}>
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <IconTrophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isWinner ? '🎉 You Win!' : 'Game Over!'}
          </CardTitle>
          <CardDescription>
            {winner ? (
              <>
                {winner.id === currentUserId ? (
                  'Congratulations on your victory!'
                ) : (
                  <>
                    <span className="font-medium">{winner.name}</span> wins with{' '}
                    {winner.score} points!
                  </>
                )}
              </>
            ) : (
              `${gameName} complete`
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current user's rank (if not winner) */}
          {!isWinner && currentUserRank > 0 && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="text-sm text-muted-foreground">Your Position</div>
              <div className="text-3xl font-bold">
                #{currentUserRank}
              </div>
              <div className="text-sm text-muted-foreground">
                of {rankedPlayers.length} players
              </div>
            </div>
          )}

          {/* Final standings */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Final Standings
            </h3>
            <PlayerList
              players={rankedPlayers}
              currentUserId={currentUserId}
              showScore={true}
              showRanks={true}
              variant="compact"
            />
          </div>

          {/* Game stats */}
          {stats && stats.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Game Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-muted/50 p-3 text-center"
                  >
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {onPlayAgain && (
              <Button size="lg" onClick={onPlayAgain}>
                <IconRefresh className="mr-2 h-5 w-5" />
                Play Again
              </Button>
            )}
            {onReturnToLobby && (
              <Button size="lg" variant="outline" onClick={onReturnToLobby}>
                <IconHome className="mr-2 h-5 w-5" />
                Return to Lobby
              </Button>
            )}
            {onShare && (
              <Button size="lg" variant="ghost" onClick={onShare}>
                <IconShare className="mr-2 h-5 w-5" />
                Share Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Round results component for turn-based games
 */
interface RoundResultsProps {
  /** Round number */
  roundNumber: number;
  /** Correct answer/word */
  answer?: string;
  /** Players who scored this round */
  scorers: Array<{
    player: Player;
    points: number;
    time?: number;
  }>;
  /** Time until next round */
  countdown?: number;
  /** Custom class name */
  className?: string;
}

export function RoundResults({
  roundNumber,
  answer,
  scorers,
  countdown,
  className,
}: RoundResultsProps) {
  const sortedScorers = [...scorers].sort((a, b) => b.points - a.points);

  return (
    <Card className={cn('mx-auto max-w-sm', className)}>
      <CardHeader className="text-center">
        <CardTitle>Round {roundNumber} Complete</CardTitle>
        {answer && (
          <CardDescription>
            The answer was: <span className="font-bold text-foreground">{answer}</span>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {sortedScorers.length > 0 ? (
          <div className="space-y-2">
            {sortedScorers.map(({ player, points, time }, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span>{player.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-500">+{points}</span>
                  {time !== undefined && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {time.toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No one scored this round
          </div>
        )}

        {countdown !== undefined && (
          <div className="text-center text-sm text-muted-foreground">
            Next round in {countdown}s...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
