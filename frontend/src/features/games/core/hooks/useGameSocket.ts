/**
 * Game Socket Hook
 *
 * Manages a singleton Socket.io connection for games.
 * The socket persists across page navigations to avoid
 * reconnection issues from component mount/unmount cycles.
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import type { RootState, AppDispatch } from '@/store/store';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/events.types';
import type { GameSettings } from '../types/game.types';
import {
  setConnectionStatus,
  setConnectionError,
  setRoomState,
  clearRoom,
  addPlayer,
  removePlayer,
  updatePlayer,
  setHost,
  setSettings,
  setCountdown,
  startGame,
  setGameState,
  endGame,
} from '../store/gameSlice';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Extract base URL from API URL (remove /api suffix if present)
const getSocketBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

const SOCKET_BASE_URL = getSocketBaseUrl();

// =============================================================================
// Module-level singleton socket
// =============================================================================

let sharedSocket: GameSocket | null = null;
let handlersAttached = false;

/**
 * Attach event handlers to the socket (idempotent - only attaches once)
 */
function attachEventHandlers(socket: GameSocket, dispatch: AppDispatch): void {
  if (handlersAttached) return;
  handlersAttached = true;

  // Connection events
  socket.on('connect', () => {
    dispatch(setConnectionStatus('connected'));
  });

  socket.on('disconnect', () => {
    dispatch(setConnectionStatus('disconnected'));
  });

  socket.on('connect_error', (error) => {
    dispatch(setConnectionError(error.message));
  });

  // Room events
  socket.on('room:player_joined', ({ player }) => {
    dispatch(addPlayer(player));
  });

  socket.on('room:player_left', ({ playerId }) => {
    dispatch(removePlayer(playerId));
  });

  socket.on('room:player_ready', ({ playerId, isReady }) => {
    dispatch(updatePlayer({ id: playerId, isReady }));
  });

  socket.on('room:player_disconnected', ({ playerId }) => {
    dispatch(updatePlayer({ id: playerId, isConnected: false }));
  });

  socket.on('room:player_reconnected', ({ playerId }) => {
    dispatch(updatePlayer({ id: playerId, isConnected: true }));
  });

  socket.on('room:host_changed', ({ newHostId }) => {
    dispatch(setHost(newHostId));
  });

  socket.on('room:settings_updated', ({ settings }) => {
    dispatch(setSettings(settings));
  });

  socket.on('room:closed', () => {
    dispatch(clearRoom());
  });

  // Game lifecycle events
  socket.on('game:starting', ({ countdown }) => {
    dispatch(setCountdown(countdown));
  });

  socket.on('game:started', ({ gameState }) => {
    dispatch(startGame());
    dispatch(setGameState(gameState));
  });

  socket.on('game:state_update', ({ state }) => {
    dispatch(setGameState(state));
  });

  socket.on('game:ended', (result) => {
    dispatch(endGame(result));
  });

  // Error events
  socket.on('error', (error) => {
    console.error('Game socket error:', error);
  });
}

/**
 * Get or create the shared socket instance
 */
function getOrCreateSocket(dispatch: AppDispatch): GameSocket {
  // Already connected - reuse
  if (sharedSocket?.connected) {
    dispatch(setConnectionStatus('connected'));
    return sharedSocket;
  }

  // Exists but disconnected - reconnect
  if (sharedSocket) {
    dispatch(setConnectionStatus('connecting'));
    sharedSocket.connect();
    return sharedSocket;
  }

  // Create new socket
  dispatch(setConnectionStatus('connecting'));

  sharedSocket = io(`${SOCKET_BASE_URL}/game`, {
    path: '/game-socket',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  attachEventHandlers(sharedSocket, dispatch);

  return sharedSocket;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing game socket connection.
 * Uses a module-level singleton so the socket survives page navigations.
 */
export function useGameSocket() {
  const dispatch = useDispatch();
  const connectionStatus = useSelector((state: RootState) => state.game.connectionStatus);

  /**
   * Ensure socket is connected
   */
  const connect = useCallback(() => {
    getOrCreateSocket(dispatch);
  }, [dispatch]);

  /**
   * Fully disconnect and destroy the socket.
   * Only call when explicitly leaving the games section.
   */
  const disconnect = useCallback(() => {
    if (sharedSocket) {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
      sharedSocket = null;
      handlersAttached = false;
    }
    dispatch(setConnectionStatus('disconnected'));
  }, [dispatch]);

  /**
   * Create a new room
   */
  const createRoom = useCallback(
    (gameId: string, settings?: Partial<GameSettings>): Promise<string | null> => {
      return new Promise((resolve) => {
        if (!sharedSocket?.connected) {
          resolve(null);
          return;
        }

        sharedSocket.emit('room:create', { gameId, settings }, (response) => {
          if (response.success && response.roomCode && response.room) {
            dispatch(
              setRoomState({
                roomCode: response.roomCode,
                gameInfo: response.room.gameInfo,
                players: response.room.players,
                settings: response.room.settings,
                hostId: response.room.hostId,
                isHost: response.room.isHost,
              })
            );
            resolve(response.roomCode);
          } else {
            resolve(null);
          }
        });
      });
    },
    [dispatch]
  );

  /**
   * Join an existing room
   */
  const joinRoom = useCallback(
    (roomCode: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!sharedSocket?.connected) {
          resolve(false);
          return;
        }

        sharedSocket.emit('room:join', { roomCode }, (response) => {
          if (response.success && response.room) {
            dispatch(
              setRoomState({
                roomCode: response.room.roomCode,
                gameInfo: response.room.gameInfo,
                players: response.room.players,
                settings: response.room.settings,
                hostId: response.room.hostId,
                isHost: response.room.isHost,
              })
            );
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },
    [dispatch]
  );

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    if (sharedSocket?.connected) {
      sharedSocket.emit('room:leave');
    }
    dispatch(clearRoom());
  }, [dispatch]);

  /**
   * Set ready status
   */
  const setReady = useCallback((isReady: boolean) => {
    if (sharedSocket?.connected) {
      sharedSocket.emit('room:ready', { isReady });
    }
  }, []);

  /**
   * Update room settings (host only)
   */
  const updateRoomSettings = useCallback((settings: Partial<GameSettings>) => {
    if (sharedSocket?.connected) {
      sharedSocket.emit('room:update_settings', { settings });
    }
  }, []);

  /**
   * Start the game (host only)
   */
  const startGameAction = useCallback(() => {
    if (sharedSocket?.connected) {
      sharedSocket.emit('game:start');
    }
  }, []);

  /**
   * Send a game action
   */
  const sendAction = useCallback((type: string, payload: Record<string, unknown>) => {
    if (sharedSocket?.connected) {
      sharedSocket.emit('game:action', { type, payload });
    }
  }, []);

  /**
   * Subscribe to a game-specific event
   */
  const onGameEvent = useCallback(
    <T>(event: string, handler: (data: T) => void) => {
      if (sharedSocket) {
        sharedSocket.on(event as keyof ServerToClientEvents, handler as () => void);
        return () => {
          sharedSocket?.off(event as keyof ServerToClientEvents, handler as () => void);
        };
      }
      return () => {};
    },
    []
  );

  // Ensure socket is connected on mount (no cleanup - socket persists)
  useEffect(() => {
    connect();
  }, [connect]);

  return {
    socket: sharedSocket,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    isInitialized: sharedSocket !== null,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    updateRoomSettings,
    startGame: startGameAction,
    sendAction,
    onGameEvent,
  };
}
