/**
 * Game Socket Setup
 *
 * Initializes Socket.io namespace for games and sets up event handlers.
 */

import { Server, Namespace, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { RoomManagerService } from '../services/room-manager.service';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from '../types/events.types';
import { verifyToken } from '../../../utils/jwt';
import logger from '../../../utils/logger';

/** Socket.io server instance */
let io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

/** Game namespace */
let gameNamespace: Namespace<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

/** Room manager instance */
let roomManager: RoomManagerService;

/**
 * Initialize game socket server
 */
export function initializeGameSocket(httpServer: HttpServer, corsOrigin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void): Server {
  io = new Server(httpServer, {
    path: '/game-socket',
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  // Create game namespace
  gameNamespace = io.of('/game');

  // Initialize room manager
  roomManager = new RoomManagerService(gameNamespace);

  // Authentication middleware
  gameNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || parseCookieToken(socket.handshake.headers.cookie);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyToken(token);
      if (!payload) {
        return next(new Error('Invalid token'));
      }

      // Attach user data to socket
      socket.data.userId = payload.userId;
      socket.data.userName = payload.email.split('@')[0]; // Fallback name
      socket.data.teamId = 0; // Will be set from user lookup if needed
      socket.data.roomCode = null;

      next();
    } catch (error) {
      logger.error('Socket authentication failed', { error });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  gameNamespace.on('connection', (socket) => {
    logger.info(`Game socket connected: ${socket.id} (user: ${socket.data.userId})`);

    // Send connection established
    socket.emit('connection:established', { userId: socket.data.userId });

    // Set up event handlers
    setupRoomEvents(socket);
    setupGameEvents(socket);
    setupUtilityEvents(socket);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Game socket disconnected: ${socket.id} (reason: ${reason})`);
      roomManager.handleDisconnect(socket);
    });
  });

  logger.info('Game socket server initialized');

  return io;
}

/**
 * Set up room-related event handlers
 */
function setupRoomEvents(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
  // Create room
  socket.on('room:create', (data, callback) => {
    const result = roomManager.createRoom(socket, {
      gameId: data.gameId,
      teamId: socket.data.teamId,
      hostId: socket.data.userId,
      hostName: socket.data.userName,
      settings: data.settings,
    });

    if (result.success) {
      callback({ success: true, roomCode: result.roomCode, room: result.room });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Join room
  socket.on('room:join', (data, callback) => {
    const result = roomManager.joinRoom(socket, {
      roomCode: data.roomCode,
      userId: socket.data.userId,
      userName: socket.data.userName,
    });

    if (result.success) {
      callback({ success: true, room: result.room });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Leave room
  socket.on('room:leave', () => {
    roomManager.leaveRoom(socket);
  });

  // Set ready status
  socket.on('room:ready', (data) => {
    roomManager.setPlayerReady(socket, data.isReady);
  });

  // Update settings
  socket.on('room:update_settings', (data) => {
    const result = roomManager.updateSettings(socket, data.settings);
    if (!result.success) {
      socket.emit('error', {
        code: 'SETTINGS_UPDATE_FAILED',
        message: result.error || 'Failed to update settings',
      });
    }
  });

  // Kick player (host only)
  socket.on('room:kick_player', (data) => {
    // TODO: Implement kick functionality
    logger.warn('Kick player not yet implemented');
  });
}

/**
 * Set up game-related event handlers
 */
function setupGameEvents(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
  // Start game
  socket.on('game:start', async () => {
    const result = await roomManager.startGame(socket);
    if (!result.success) {
      socket.emit('error', {
        code: 'GAME_START_FAILED',
        message: result.error || 'Failed to start game',
      });
    }
  });

  // Handle game action
  socket.on('game:action', async (data) => {
    const result = await roomManager.handleGameAction(socket, data.type, data.payload);
    if (!result.success) {
      socket.emit('error', {
        code: 'ACTION_FAILED',
        message: result.error || 'Action failed',
      });
    }
  });
}

/**
 * Set up utility event handlers
 */
function setupUtilityEvents(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
  // Ping/pong for latency measurement
  socket.on('ping', (callback) => {
    callback({ timestamp: Date.now() });
  });
}

/**
 * Parse JWT token from cookie string
 */
function parseCookieToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['token'] || null;
}

/**
 * Get the game namespace (for use in other services)
 */
export function getGameNamespace(): Namespace<ClientToServerEvents, ServerToClientEvents, {}, SocketData> {
  return gameNamespace;
}

/**
 * Get the room manager (for use in REST endpoints)
 */
export function getRoomManager(): RoomManagerService {
  return roomManager;
}
