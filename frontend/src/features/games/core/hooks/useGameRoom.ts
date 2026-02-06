/**
 * Game Room Hook
 *
 * Provides easy access to room state and actions.
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import type { RootState } from '@/store/store';
import { useGameSocket } from './useGameSocket';

/**
 * Hook for accessing room state and actions
 */
export function useGameRoom() {
  const {
    isConnected,
    connectionStatus,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    updateRoomSettings,
    startGame,
  } = useGameSocket();

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const {
    roomCode,
    gameId,
    gameInfo,
    players,
    settings,
    hostId,
    status,
    isHost,
    countdown,
    isGameActive,
    gameResult,
  } = useSelector((state: RootState) => state.game);

  // Compute derived state
  const currentPlayer = useMemo(
    () => players.find((p) => p.id === currentUserId),
    [players, currentUserId]
  );

  const connectedPlayers = useMemo(
    () => players.filter((p) => p.isConnected),
    [players]
  );

  const readyPlayers = useMemo(
    () => players.filter((p) => p.isReady),
    [players]
  );

  const canStartGame = useMemo(() => {
    if (!isHost || !gameInfo) return false;
    const readyCount = readyPlayers.length;
    return readyCount >= gameInfo.minPlayers && readyCount <= gameInfo.maxPlayers;
  }, [isHost, gameInfo, readyPlayers]);

  const isInRoom = Boolean(roomCode);

  return {
    // Connection
    isConnected,
    connectionStatus,

    // Room state
    roomCode,
    gameId,
    gameInfo,
    players,
    settings,
    hostId,
    status,
    isHost,
    isInRoom,
    countdown,
    isGameActive,
    gameResult,

    // Current player
    currentUserId,
    currentPlayer,

    // Computed
    connectedPlayers,
    readyPlayers,
    canStartGame,

    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    updateRoomSettings,
    startGame,
  };
}
