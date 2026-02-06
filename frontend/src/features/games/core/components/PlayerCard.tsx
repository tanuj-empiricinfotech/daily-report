/**
 * Player Card Component
 *
 * Displays a player with their avatar, name, score, and status.
 */

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from '@/components/ui/avatar';
import { IconCrown, IconWifi, IconWifiOff, IconCheck, IconPencil } from '@tabler/icons-react';
import type { Player } from '../types/game.types';

interface PlayerCardProps {
  player: Player;
  /** Whether this is the current user */
  isCurrentUser?: boolean;
  /** Whether this player is the host */
  isHost?: boolean;
  /** Whether this player is currently drawing/active */
  isActive?: boolean;
  /** Show ready status */
  showReadyStatus?: boolean;
  /** Show score */
  showScore?: boolean;
  /** Rank position (1, 2, 3, etc.) */
  rank?: number;
  /** Points gained this round */
  roundPoints?: number;
  /** Visual variant */
  variant?: 'default' | 'compact' | 'large';
  /** Click handler */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get rank medal color
 */
function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-yellow-500';
    case 2:
      return 'text-gray-400';
    case 3:
      return 'text-amber-600';
    default:
      return 'text-muted-foreground';
  }
}

export function PlayerCard({
  player,
  isCurrentUser = false,
  isHost = false,
  isActive = false,
  showReadyStatus = false,
  showScore = true,
  rank,
  roundPoints,
  variant = 'default',
  onClick,
  className,
}: PlayerCardProps) {
  const variantClasses = {
    default: 'p-3',
    compact: 'p-2',
    large: 'p-4',
  };

  const avatarSize = {
    default: 'default' as const,
    compact: 'sm' as const,
    large: 'lg' as const,
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg transition-colors',
        variantClasses[variant],
        isActive && 'bg-primary/10 ring-2 ring-primary',
        isCurrentUser && !isActive && 'bg-muted/50',
        !player.isConnected && 'opacity-50',
        onClick && 'cursor-pointer hover:bg-muted',
        className
      )}
      onClick={onClick}
    >
      {/* Rank */}
      {rank !== undefined && (
        <span className={cn('w-6 text-center font-bold', getRankColor(rank))}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
        </span>
      )}

      {/* Avatar */}
      <div className="relative">
        <Avatar size={avatarSize[variant]}>
          {player.avatarUrl && <AvatarImage src={player.avatarUrl} alt={player.name} />}
          <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
          {/* Connection status badge */}
          <AvatarBadge
            className={cn(player.isConnected ? 'bg-green-500' : 'bg-gray-400')}
          />
        </Avatar>
        {/* Host crown */}
        {isHost && (
          <IconCrown className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500" />
        )}
      </div>

      {/* Name and status */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate font-medium',
              variant === 'compact' && 'text-sm',
              variant === 'large' && 'text-lg'
            )}
          >
            {player.name}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">(You)</span>
          )}
          {isActive && <IconPencil className="h-4 w-4 text-primary" />}
        </div>

        {/* Ready status */}
        {showReadyStatus && (
          <div className="flex items-center gap-1 text-xs">
            {player.isReady ? (
              <>
                <IconCheck className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Ready</span>
              </>
            ) : (
              <span className="text-muted-foreground">Not ready</span>
            )}
          </div>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <div className="text-right">
          <div className={cn('font-bold', variant === 'large' && 'text-xl')}>
            {player.score}
          </div>
          {roundPoints !== undefined && roundPoints > 0 && (
            <div className="text-xs text-green-500">+{roundPoints}</div>
          )}
        </div>
      )}

      {/* Connection icon for compact variant */}
      {variant === 'compact' && (
        <div className="ml-auto">
          {player.isConnected ? (
            <IconWifi className="h-4 w-4 text-green-500" />
          ) : (
            <IconWifiOff className="h-4 w-4 text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Player list component
 */
interface PlayerListProps {
  players: Player[];
  currentUserId?: number;
  hostId?: number;
  activePlayerId?: number;
  showReadyStatus?: boolean;
  showScore?: boolean;
  showRanks?: boolean;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

export function PlayerList({
  players,
  currentUserId,
  hostId,
  activePlayerId,
  showReadyStatus = false,
  showScore = true,
  showRanks = false,
  variant = 'default',
  className,
}: PlayerListProps) {
  // Sort by score if showing ranks
  const sortedPlayers = showRanks
    ? [...players].sort((a, b) => b.score - a.score)
    : players;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {sortedPlayers.map((player, index) => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentUser={player.id === currentUserId}
          isHost={player.id === hostId}
          isActive={player.id === activePlayerId}
          showReadyStatus={showReadyStatus}
          showScore={showScore}
          rank={showRanks ? index + 1 : undefined}
          variant={variant}
        />
      ))}
    </div>
  );
}
