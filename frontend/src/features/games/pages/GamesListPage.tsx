/**
 * Games List Page
 *
 * Shows all available games that can be played.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconUsers, IconPlayerPlay, IconArrowRight } from '@tabler/icons-react';
import { gameRegistry } from '../core/registry/game-registry';
import { useGameRoom } from '../core/hooks/useGameRoom';

// Register games on module load
import { registerSkribbl } from '../implementations/skribbl';
registerSkribbl();

export function GamesListPage() {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useGameRoom();
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const games = gameRegistry.getAll();

  const handleCreateGame = async (gameId: string) => {
    setIsCreating(gameId);
    try {
      const roomCode = await createRoom(gameId);
      if (roomCode) {
        navigate(`/games/room/${roomCode}`);
      }
    } finally {
      setIsCreating(null);
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const success = await joinRoom(joinCode.trim().toUpperCase());
      if (success) {
        navigate(`/games/room/${joinCode.trim().toUpperCase()}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Team Games</h1>
        <p className="text-muted-foreground">
          Play fun multiplayer games with your team
        </p>
      </div>

      {/* Join existing room */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Join a Game</CardTitle>
          <CardDescription>Enter a room code to join an existing game</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code..."
              className="font-mono uppercase tracking-widest"
              maxLength={6}
            />
            <Button
              onClick={handleJoinGame}
              disabled={!joinCode.trim() || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join'}
              <IconArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available games */}
      <div className="grid gap-4 md:grid-cols-2">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Card key={game.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconUsers className="h-4 w-4" />
                    <span>
                      {game.minPlayers}-{game.maxPlayers} players
                    </span>
                  </div>
                  <Button
                    onClick={() => handleCreateGame(game.id)}
                    disabled={isCreating === game.id}
                  >
                    {isCreating === game.id ? (
                      'Creating...'
                    ) : (
                      <>
                        <IconPlayerPlay className="mr-2 h-4 w-4" />
                        Create Room
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {games.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p>No games available yet.</p>
          <p className="text-sm">Games will appear here once they are registered.</p>
        </div>
      )}
    </div>
  );
}
