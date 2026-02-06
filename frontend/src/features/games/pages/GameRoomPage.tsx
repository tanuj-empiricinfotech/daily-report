/**
 * Game Room Page
 *
 * Handles the game lobby and active gameplay.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameRoom } from '../core/hooks/useGameRoom';
import { gameRegistry } from '../core/registry/game-registry';
import { GameLobby } from '../core/components/GameLobby';
import { GameResults } from '../core/components/GameResults';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Register games
import { registerSkribbl } from '../implementations/skribbl';
registerSkribbl();

export function GameRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const {
    isConnected,
    connectionStatus,
    roomCode: currentRoomCode,
    gameId,
    gameInfo,
    players,
    settings,
    currentUserId,
    currentPlayer,
    hostId,
    isHost,
    status,
    countdown,
    isGameActive,
    gameResult,
    canStartGame,
    joinRoom,
    leaveRoom,
    setReady,
    updateRoomSettings,
    startGame,
  } = useGameRoom();

  // Join/rejoin room whenever socket connects.
  // After navigation, a new socket is created that isn't in the Socket.io room,
  // so we must always call joinRoom. The backend handles reconnections idempotently.
  useEffect(() => {
    if (roomCode && isConnected) {
      joinRoom(roomCode);
    }
  }, [roomCode, isConnected, joinRoom]);

  // Handle leave
  const handleLeave = () => {
    leaveRoom();
    navigate('/games');
  };

  // Handle play again
  const handlePlayAgain = () => {
    // Reset and stay in lobby
    navigate(`/games/room/${roomCode}`);
  };

  // Loading state
  if (connectionStatus === 'connecting') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Connecting...</span>
      </div>
    );
  }

  // Not in room yet
  if (!currentRoomCode || !gameInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Joining room...</span>
      </div>
    );
  }

  // Game finished - show results
  if (status === 'finished' && gameResult) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <GameResults
          result={gameResult}
          players={players}
          currentUserId={currentUserId ?? undefined}
          gameName={gameInfo.name}
          isWinner={gameResult.winnerId === currentUserId}
          onPlayAgain={isHost ? handlePlayAgain : undefined}
          onReturnToLobby={handleLeave}
        />
      </div>
    );
  }

  // Active game
  if (isGameActive && gameId) {
    const GameComponent = gameRegistry.getComponent(gameId);
    if (GameComponent) {
      return <GameComponent onLeave={handleLeave} />;
    }
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Game component not found</p>
      </div>
    );
  }

  // Lobby
  const LobbySettingsComponent = gameId
    ? gameRegistry.getLobbyComponent(gameId)
    : null;

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <GameLobby
        roomCode={currentRoomCode}
        gameInfo={gameInfo}
        players={players}
        settings={settings}
        currentUserId={currentUserId ?? undefined}
        hostId={hostId ?? undefined}
        isHost={isHost}
        isReady={currentPlayer?.isReady ?? false}
        canStart={canStartGame}
        countdown={countdown}
        settingsComponent={
          LobbySettingsComponent && isHost ? (
            <LobbySettingsComponent
              settings={settings}
              onChange={updateRoomSettings}
              disabled={!isHost}
            />
          ) : undefined
        }
        onReadyChange={setReady}
        onSettingsChange={isHost ? updateRoomSettings : undefined}
        onStartGame={startGame}
        onLeave={handleLeave}
      />
    </div>
  );
}
