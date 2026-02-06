/**
 * GameLobby Component
 *
 * Pre-game lobby where players wait, ready up, and configure settings.
 */

import { useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerList } from './PlayerCard';
import { IconCopy, IconCheck, IconUsers, IconSettings, IconPlayerPlay, IconLogout, IconShare } from '@tabler/icons-react';
import type { Player, GameInfo, GameSettings } from '../types/game.types';

interface GameLobbyProps {
  /** Room code for sharing */
  roomCode: string;
  /** Game information */
  gameInfo: GameInfo;
  /** List of players in the room */
  players: Player[];
  /** Current game settings */
  settings: GameSettings;
  /** Current user's ID */
  currentUserId?: number;
  /** Host player ID */
  hostId?: number;
  /** Whether current user is host */
  isHost: boolean;
  /** Whether current user is ready */
  isReady: boolean;
  /** Whether game can be started (enough players, all ready, etc.) */
  canStart: boolean;
  /** Countdown before game starts (null if not counting down) */
  countdown?: number | null;
  /** Custom settings component */
  settingsComponent?: ReactNode;
  /** Called when ready status changes */
  onReadyChange: (ready: boolean) => void;
  /** Called when settings change (host only) */
  onSettingsChange?: (settings: GameSettings) => void;
  /** Called when start button is clicked (host only) */
  onStartGame: () => void;
  /** Called when leave button is clicked */
  onLeave: () => void;
  /** Custom class name */
  className?: string;
}

export function GameLobby({
  roomCode,
  gameInfo,
  players,
  settings,
  currentUserId,
  hostId,
  isHost,
  isReady,
  canStart,
  countdown,
  settingsComponent,
  onReadyChange,
  onStartGame,
  onLeave,
  className,
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const readyCount = players.filter((p) => p.isReady).length;
  const shareUrl = `${window.location.origin}/games/join/${roomCode}`;

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${gameInfo.name}`,
          text: `Join my ${gameInfo.name} game!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyCode();
    }
  }, [gameInfo.name, shareUrl, handleCopyCode]);

  return (
    <div className={cn('flex flex-col gap-6 md:flex-row', className)}>
      {/* Main content */}
      <div className="flex-1 space-y-4">
        {/* Room header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{gameInfo.name}</CardTitle>
                <CardDescription>{gameInfo.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onLeave}>
                <IconLogout className="mr-2 h-4 w-4" />
                Leave
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Room code sharing */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Room Code</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={roomCode}
                    readOnly
                    className="font-mono text-lg tracking-widest"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    {copied ? (
                      <IconCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <IconCopy className="h-4 w-4" />
                    )}
                  </Button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <IconShare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Player count */}
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <IconUsers className="h-4 w-4" />
              <span>
                {players.length} / {gameInfo.maxPlayers} players
                {players.length < gameInfo.minPlayers && (
                  <span className="text-destructive">
                    {' '}
                    (need {gameInfo.minPlayers - players.length} more)
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Players list */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              Players ({readyCount}/{players.length} ready)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerList
              players={players}
              currentUserId={currentUserId}
              hostId={hostId}
              showReadyStatus={true}
              showScore={false}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Ready button */}
          <Button
            size="lg"
            variant={isReady ? 'secondary' : 'default'}
            className="flex-1"
            onClick={() => onReadyChange(!isReady)}
          >
            {isReady ? (
              <>
                <IconCheck className="mr-2 h-5 w-5" />
                Ready!
              </>
            ) : (
              'Ready Up'
            )}
          </Button>

          {/* Start button (host only) */}
          {isHost && (
            <Button
              size="lg"
              className="flex-1"
              disabled={!canStart}
              onClick={onStartGame}
            >
              {countdown !== null && countdown !== undefined ? (
                `Starting in ${countdown}...`
              ) : (
                <>
                  <IconPlayerPlay className="mr-2 h-5 w-5" />
                  Start Game
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Settings sidebar */}
      <div className="w-full md:w-80">
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconSettings className="h-5 w-5" />
                Settings
              </CardTitle>
              {isHost && (
                <span className="text-xs text-muted-foreground">Click to edit</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {settingsComponent || (
              <div className="space-y-3 text-sm">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Compact lobby header for in-game display
 */
interface LobbyHeaderProps {
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  onLeave: () => void;
  className?: string;
}

export function LobbyHeader({
  roomCode,
  playerCount,
  maxPlayers,
  onLeave,
  className,
}: LobbyHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-muted-foreground">
          Room: {roomCode}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <IconUsers className="h-4 w-4" />
          {playerCount}/{maxPlayers}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onLeave}>
        <IconLogout className="mr-2 h-4 w-4" />
        Leave
      </Button>
    </div>
  );
}
