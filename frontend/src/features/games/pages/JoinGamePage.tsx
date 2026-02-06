/**
 * Join Game Page
 *
 * Redirects to game room after joining via shared link.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameRoom } from '../core/hooks/useGameRoom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function JoinGamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { joinRoom, isConnected, connectionStatus } = useGameRoom();
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const join = async () => {
      if (!roomCode || !isConnected || isJoining) return;

      setIsJoining(true);
      setError(null);

      try {
        const success = await joinRoom(roomCode);
        if (success) {
          navigate(`/games/room/${roomCode}`, { replace: true });
        } else {
          setError('Failed to join room. It may not exist or is full.');
        }
      } catch (err) {
        setError('An error occurred while joining the room.');
      } finally {
        setIsJoining(false);
      }
    };

    join();
  }, [roomCode, isConnected, joinRoom, navigate, isJoining]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to Join</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/games')} className="w-full">
              Browse Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">
          {connectionStatus === 'connecting'
            ? 'Connecting...'
            : `Joining room ${roomCode}...`}
        </p>
      </div>
    </div>
  );
}
