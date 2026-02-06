/**
 * Game Socket Hook
 *
 * Manages Socket.io connection for games.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import type { RootState } from '@/store/store';
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
  // Remove /api or /api/ suffix to get the base server URL
  return apiUrl.replace(/\/api\/?$/, '');
};

const SOCKET_BASE_URL = getSocketBaseUrl();

/**
 * Hook for managing game socket connection
 */
export function useGameSocket() {
  const dispatch = useDispatch();
  const socketRef = useRef<GameSocket | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const connectionStatus = useSelector((state: RootState) => state.game.connectionStatus);

  /**
   * Connect to game socket
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    dispatch(setConnectionStatus('connecting'));

    const socket: GameSocket = io(`${SOCKET_BASE_URL}/game`, {
      path: '/game-socket',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });

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

    socketRef.current = socket;
    setIsInitialized(true);
  }, [dispatch]);

  /**
   * Disconnect from game socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  /**
   * Create a new room
   */
  const createRoom = useCallback(
    (gameId: string, settings?: Partial<GameSettings>): Promise<string | null> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve(null);
          return;
        }

        socketRef.current.emit('room:create', { gameId, settings }, (response) => {
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
        if (!socketRef.current?.connected) {
          resolve(false);
          return;
        }

        socketRef.current.emit('room:join', { roomCode }, (response) => {
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
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:leave');
    }
    dispatch(clearRoom());
  }, [dispatch]);

  /**
   * Set ready status
   */
  const setReady = useCallback((isReady: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:ready', { isReady });
    }
  }, []);

  /**
   * Update room settings (host only)
   */
  const updateRoomSettings = useCallback((settings: Partial<GameSettings>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:update_settings', { settings });
    }
  }, []);

  /**
   * Start the game (host only)
   */
  const startGameAction = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('game:start');
    }
  }, []);

  /**
   * Send a game action
   */
  const sendAction = useCallback((type: string, payload: Record<string, unknown>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('game:action', { type, payload });
    }
  }, []);

  /**
   * Subscribe to a game-specific event
   */
  const onGameEvent = useCallback(
    <T>(event: string, handler: (data: T) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event as keyof ServerToClientEvents, handler as () => void);
        return () => {
          socketRef.current?.off(event as keyof ServerToClientEvents, handler as () => void);
        };
      }
      return () => {};
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    isInitialized,
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
