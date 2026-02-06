/**
 * Room Manager Service
 *
 * Manages game room lifecycle - creation, joining, leaving, and cleanup.
 * Acts as the bridge between Socket.io and game instances.
 */

import type { Namespace, Socket } from 'socket.io';
import { gameRegistry } from './game-registry.service';
import { generateRoomCode as generateCode } from '../utils/room-code.util';
import { GameContextImpl } from './game-context.impl';
import type { IGameDefinition } from '../interfaces/game.interface';
import type {
  Room,
  Player,
  CreateRoomOptions,
  JoinRoomOptions,
  GameSettings,
  GameResult,
  PublicPlayer,
} from '../types/common.types';
import type { SocketData, RoomJoinedEvent } from '../types/events.types';
import logger from '../../../utils/logger';

/** Room code length */
const ROOM_CODE_LENGTH = 6;

/** Grace period for reconnection (ms) */
const RECONNECT_GRACE_PERIOD_MS = 30000;

/**
 * Active room with game instance
 */
interface ActiveRoom {
  room: Room;
  game: IGameDefinition;
  context: GameContextImpl;
  startedAt?: Date;
  disconnectTimers: Map<number, NodeJS.Timeout>;
}

/**
 * Room Manager Service
 *
 * Manages all active game rooms and coordinates between
 * Socket.io events and game logic.
 */
export class RoomManagerService {
  private rooms: Map<string, ActiveRoom> = new Map();
  private playerRooms: Map<number, string> = new Map(); // userId -> roomCode
  private namespace: Namespace;

  constructor(namespace: Namespace) {
    this.namespace = namespace;
  }

  // =========================================================================
  // Room Lifecycle
  // =========================================================================

  /**
   * Create a new game room
   */
  createRoom(socket: Socket, options: CreateRoomOptions): { success: boolean; roomCode?: string; room?: RoomJoinedEvent; error?: string } {
    const { gameId, teamId, hostId, hostName, settings } = options;
    const socketData = socket.data as SocketData;

    // Check if user is already in a room
    if (this.playerRooms.has(hostId)) {
      return { success: false, error: 'Already in a room' };
    }

    // Get game from registry
    const game = gameRegistry.get(gameId);
    if (!game) {
      return { success: false, error: `Game "${gameId}" not found` };
    }

    // Generate unique room code
    const roomCode = this.generateRoomCode();

    // Create host player
    const host: Player = {
      id: hostId,
      name: hostName,
      socketId: socket.id,
      isReady: false,
      isConnected: true,
      score: 0,
      joinedAt: new Date(),
    };

    // Create room
    const room: Room = {
      code: roomCode,
      gameId,
      teamId,
      hostId,
      players: new Map([[hostId, host]]),
      settings: { ...game.defaultSettings, ...settings },
      status: 'lobby',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create game context
    const context = new GameContextImpl(room, this.namespace, (reason) => {
      this.handleGameEnd(roomCode, reason);
    });

    // Store active room
    const activeRoom: ActiveRoom = {
      room,
      game,
      context,
      disconnectTimers: new Map(),
    };
    this.rooms.set(roomCode, activeRoom);
    this.playerRooms.set(hostId, roomCode);

    // Join socket to room
    socket.join(roomCode);
    socketData.roomCode = roomCode;

    logger.info(`Room created: ${roomCode} for game ${gameId} by user ${hostId}`);

    return {
      success: true,
      roomCode,
      room: this.getRoomState(roomCode, hostId),
    };
  }

  /**
   * Join an existing room
   */
  joinRoom(socket: Socket, options: JoinRoomOptions): { success: boolean; room?: RoomJoinedEvent; error?: string } {
    const { roomCode, userId, userName } = options;
    const socketData = socket.data as SocketData;
    const normalizedCode = roomCode.toUpperCase();

    // Check if user is already in a different room
    const existingRoom = this.playerRooms.get(userId);
    if (existingRoom && existingRoom !== normalizedCode) {
      return { success: false, error: 'Already in another room' };
    }

    // Get active room
    const activeRoom = this.rooms.get(normalizedCode);
    if (!activeRoom) {
      return { success: false, error: 'Room not found' };
    }

    const { room, game, context, disconnectTimers } = activeRoom;

    // Check if rejoining
    const existingPlayer = room.players.get(userId);
    if (existingPlayer) {
      // Cancel disconnect timer if exists
      const timer = disconnectTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(userId);
      }

      // Update connection info
      existingPlayer.socketId = socket.id;
      existingPlayer.isConnected = true;

      // Join socket to room
      socket.join(normalizedCode);
      socketData.roomCode = normalizedCode;

      // Notify about reconnection
      game.onPlayerReconnect?.(context, userId);

      // Broadcast reconnection to other players
      socket.to(normalizedCode).emit('room:player_reconnected', { playerId: userId });

      logger.info(`Player ${userId} reconnected to room ${normalizedCode}`);

      return {
        success: true,
        room: this.getRoomState(normalizedCode, userId),
      };
    }

    // Check room capacity
    if (room.players.size >= game.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // Check if game already started
    if (room.status !== 'lobby') {
      return { success: false, error: 'Game already in progress' };
    }

    // Create new player
    const player: Player = {
      id: userId,
      name: userName,
      socketId: socket.id,
      isReady: false,
      isConnected: true,
      score: 0,
      joinedAt: new Date(),
    };

    // Add to room
    room.players.set(userId, player);
    this.playerRooms.set(userId, normalizedCode);

    // Join socket to room
    socket.join(normalizedCode);
    socketData.roomCode = normalizedCode;

    // Notify game
    game.onPlayerJoin(context, player);

    // Broadcast to other players in the room
    socket.to(normalizedCode).emit('room:player_joined', {
      player: this.sanitizePlayer(player),
    });

    logger.info(`Player ${userId} joined room ${normalizedCode}`);

    return {
      success: true,
      room: this.getRoomState(normalizedCode, userId),
    };
  }

  /**
   * Leave a room
   */
  leaveRoom(socket: Socket): void {
    const socketData = socket.data as SocketData;
    const { userId, roomCode } = socketData;

    if (!roomCode) return;

    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return;

    this.removePlayerFromRoom(activeRoom, userId, 'left');
    socket.leave(roomCode);
    socketData.roomCode = null;
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(socket: Socket): void {
    const socketData = socket.data as SocketData;
    const { userId, roomCode } = socketData;

    if (!roomCode) return;

    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return;

    const player = activeRoom.room.players.get(userId);
    if (!player) return;

    // Mark as disconnected
    player.isConnected = false;

    // Notify room
    this.namespace.to(roomCode).emit('room:player_disconnected', { playerId: userId });

    // Set grace period timer
    const timer = setTimeout(() => {
      this.removePlayerFromRoom(activeRoom, userId, 'timeout');
    }, RECONNECT_GRACE_PERIOD_MS);

    activeRoom.disconnectTimers.set(userId, timer);

    logger.info(`Player ${userId} disconnected from room ${roomCode}, grace period started`);
  }

  /**
   * Remove player from room
   */
  private removePlayerFromRoom(activeRoom: ActiveRoom, userId: number, reason: string): void {
    const { room, game, context, disconnectTimers } = activeRoom;

    // Clear disconnect timer
    const timer = disconnectTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      disconnectTimers.delete(userId);
    }

    // Remove from tracking
    room.players.delete(userId);
    this.playerRooms.delete(userId);

    // Notify game
    game.onPlayerLeave(context, userId);

    // Broadcast player removal to remaining players
    this.namespace.to(room.code).emit('room:player_left', {
      playerId: userId,
      reason,
    });

    // Handle host leaving
    if (room.hostId === userId && room.players.size > 0) {
      const newHostId = room.players.keys().next().value;
      if (newHostId !== undefined) {
        room.hostId = newHostId;
        this.namespace.to(room.code).emit('room:host_changed', { newHostId });
      }
    }

    // Clean up empty room
    if (room.players.size === 0) {
      this.destroyRoom(room.code);
    }

    logger.info(`Player ${userId} removed from room ${room.code} (${reason})`);
  }

  /**
   * Destroy a room
   */
  private destroyRoom(roomCode: string): void {
    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return;

    // Clear all disconnect timers
    for (const timer of activeRoom.disconnectTimers.values()) {
      clearTimeout(timer);
    }

    // Cleanup game
    activeRoom.game.cleanup?.();
    activeRoom.context.destroy();

    // Remove from registry
    this.rooms.delete(roomCode);

    logger.info(`Room ${roomCode} destroyed`);
  }

  // =========================================================================
  // Game Control
  // =========================================================================

  /**
   * Set player ready status
   */
  setPlayerReady(socket: Socket, isReady: boolean): void {
    const socketData = socket.data as SocketData;
    const { userId, roomCode } = socketData;

    if (!roomCode) return;

    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return;

    const player = activeRoom.room.players.get(userId);
    if (!player) return;

    player.isReady = isReady;

    this.namespace.to(roomCode).emit('room:player_ready', {
      playerId: userId,
      isReady,
    });
  }

  /**
   * Update room settings (host only)
   */
  updateSettings(socket: Socket, settings: Partial<GameSettings>): { success: boolean; error?: string } {
    const socketData = socket.data as SocketData;
    const { userId, roomCode } = socketData;

    if (!roomCode) return { success: false, error: 'Not in a room' };

    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return { success: false, error: 'Room not found' };

    const { room, game, context } = activeRoom;

    // Only host can update settings
    if (room.hostId !== userId) {
      return { success: false, error: 'Only host can update settings' };
    }

    // Can't update during game
    if (room.status !== 'lobby') {
      return { success: false, error: 'Cannot update settings during game' };
    }

    // Merge settings
    room.settings = { ...room.settings, ...settings };
    room.updatedAt = new Date();

    // Notify game
    game.onSettingsUpdate?.(context, room.settings);

    // Broadcast updated settings to all players in the room
    this.namespace.to(roomCode).emit('room:settings_updated', {
      settings: room.settings,
    });

    return { success: true };
  }

  /**
   * Start the game (host only)
   */
  async startGame(socket: Socket): Promise<{ success: boolean; error?: string }> {
    const socketData = socket.data as SocketData;
    const { userId, roomCode } = socketData;

    if (!roomCode) return { success: false, error: 'Not in a room' };

    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return { success: false, error: 'Room not found' };

    const { room, game, context } = activeRoom;

    // Only host can start
    if (room.hostId !== userId) {
      return { success: false, error: 'Only host can start the game' };
    }

    // Validate game can start
    const validationError = game.validateGameStart?.(context);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Check minimum players
    const connectedCount = context.getConnectedPlayerCount();
    if (connectedCount < game.minPlayers) {
      return { success: false, error: `Need at least ${game.minPlayers} players` };
    }

    // Update room status
    room.status = 'starting';
    activeRoom.startedAt = new Date();

    // Countdown
    this.namespace.to(roomCode).emit('game:starting', { countdown: 3 });

    // Wait for countdown
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Start game
    room.status = 'active';
    context.setGameActive(true);

    // Initialize game state
    const initialState = game.getInitialState();
    context.setState(initialState);

    // Call game start
    await game.onGameStart(context);

    logger.info(`Game started in room ${roomCode}`);

    return { success: true };
  }

  /**
   * Handle game action
   */
  async handleGameAction(
    socket: Socket,
    actionType: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string; data?: unknown }> {
    const socketData = socket.data as SocketData;
    const { userId, roomCode } = socketData;

    if (!roomCode) return { success: false, error: 'Not in a room' };

    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return { success: false, error: 'Room not found' };

    const { room, game, context } = activeRoom;

    // Must be in active game
    if (room.status !== 'active') {
      return { success: false, error: 'Game not active' };
    }

    // Create action object
    const action = {
      type: actionType,
      playerId: userId,
      payload,
      timestamp: Date.now(),
    };

    // Handle action
    const result = await game.handleAction(context, action);

    return result;
  }

  /**
   * Handle game end
   */
  private handleGameEnd(roomCode: string, reason: string): void {
    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return;

    const { room, game, context } = activeRoom;

    // Get final results
    const result = game.onGameEnd(context);
    result.duration = activeRoom.startedAt
      ? Date.now() - activeRoom.startedAt.getTime()
      : 0;

    // Update room status
    room.status = 'finished';
    context.setGameActive(false);

    // Broadcast game end
    this.namespace.to(roomCode).emit('game:ended', {
      reason,
      ...result,
    });

    logger.info(`Game ended in room ${roomCode}: ${reason}`);

    // TODO: Save game results to database
  }

  // =========================================================================
  // Utilities
  // =========================================================================

  /**
   * Generate unique room code
   */
  private generateRoomCode(): string {
    let code: string;
    do {
      code = generateCode(ROOM_CODE_LENGTH);
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Get room state for a player (for join response)
   */
  private getRoomState(roomCode: string, playerId: number): RoomJoinedEvent | undefined {
    const activeRoom = this.rooms.get(roomCode);
    if (!activeRoom) return undefined;

    const { room, game } = activeRoom;

    return {
      roomCode: room.code,
      gameInfo: {
        id: game.id,
        name: game.name,
        description: game.description,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
      },
      players: this.sanitizePlayers(room.players.values()),
      settings: room.settings,
      hostId: room.hostId,
      isHost: room.hostId === playerId,
    };
  }

  /**
   * Sanitize a single player for public transmission
   */
  private sanitizePlayer(player: Player): PublicPlayer {
    return {
      id: player.id,
      name: player.name,
      avatarUrl: player.avatarUrl,
      isReady: player.isReady,
      isConnected: player.isConnected,
      score: player.score,
    };
  }

  /**
   * Sanitize players for public transmission
   */
  private sanitizePlayers(players: Iterable<Player>): PublicPlayer[] {
    return Array.from(players).map((p) => this.sanitizePlayer(p));
  }

  /**
   * Get room by code
   */
  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode)?.room;
  }

  /**
   * Get all active rooms
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).map((ar) => ar.room);
  }

  /**
   * Get rooms by team
   */
  getRoomsByTeam(teamId: number): Room[] {
    return this.getAllRooms().filter((room) => room.teamId === teamId);
  }
}
