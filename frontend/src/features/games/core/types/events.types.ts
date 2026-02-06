/**
 * Socket Event Types for Frontend
 *
 * Type definitions for all socket.io events.
 */

import type { Player, GameInfo, GameSettings, PlayerScore } from './game.types';

// =============================================================================
// Server -> Client Events
// =============================================================================

export interface ServerToClientEvents {
  // Connection events
  'connection:established': (data: { userId: number }) => void;
  'connection:error': (data: { message: string; code: string }) => void;

  // Room events
  'room:created': (data: RoomCreatedEvent) => void;
  'room:joined': (data: RoomJoinedEvent) => void;
  'room:left': (data: { playerId: number }) => void;
  'room:state': (data: RoomStateEvent) => void;
  'room:player_joined': (data: { player: Player }) => void;
  'room:player_left': (data: { playerId: number; reason: string }) => void;
  'room:player_ready': (data: { playerId: number; isReady: boolean }) => void;
  'room:player_disconnected': (data: { playerId: number }) => void;
  'room:player_reconnected': (data: { playerId: number }) => void;
  'room:host_changed': (data: { newHostId: number }) => void;
  'room:settings_updated': (data: { settings: GameSettings }) => void;
  'room:closed': (data: { reason: string }) => void;

  // Game lifecycle events
  'game:starting': (data: { countdown: number }) => void;
  'game:started': (data: { gameState: unknown }) => void;
  'game:state_update': (data: { state: unknown }) => void;
  'game:ended': (data: GameEndedEvent) => void;

  // Error events
  error: (data: GameErrorEvent) => void;
}

// =============================================================================
// Client -> Server Events
// =============================================================================

export interface ClientToServerEvents {
  // Room events
  'room:create': (
    data: CreateRoomEvent,
    callback: (response: RoomCreatedResponse) => void
  ) => void;
  'room:join': (
    data: JoinRoomEvent,
    callback: (response: JoinRoomResponse) => void
  ) => void;
  'room:leave': () => void;
  'room:ready': (data: { isReady: boolean }) => void;
  'room:update_settings': (data: { settings: Partial<GameSettings> }) => void;
  'room:kick_player': (data: { playerId: number }) => void;

  // Game events
  'game:start': () => void;
  'game:action': (data: GameActionEvent) => void;

  // Utility
  ping: (callback: (response: { timestamp: number }) => void) => void;
}

// =============================================================================
// Event Data Interfaces
// =============================================================================

export interface RoomCreatedEvent {
  roomCode: string;
  gameInfo: GameInfo;
  settings: GameSettings;
}

export interface RoomJoinedEvent {
  roomCode: string;
  gameInfo: GameInfo;
  players: Player[];
  settings: GameSettings;
  hostId: number;
  isHost: boolean;
}

export interface RoomStateEvent {
  roomCode: string;
  gameId: string;
  players: Player[];
  settings: GameSettings;
  hostId: number;
  status: string;
}

export interface GameEndedEvent {
  winnerId: number | null;
  finalScores: PlayerScore[];
  stats: Record<string, unknown>;
}

export interface GameErrorEvent {
  code: string;
  message: string;
  details?: unknown;
}

export interface CreateRoomEvent {
  gameId: string;
  settings?: Partial<GameSettings>;
}

export interface JoinRoomEvent {
  roomCode: string;
}

export interface GameActionEvent {
  type: string;
  payload: Record<string, unknown>;
}

// =============================================================================
// Response Interfaces
// =============================================================================

export interface RoomCreatedResponse {
  success: boolean;
  roomCode?: string;
  room?: RoomJoinedEvent;
  error?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  room?: RoomJoinedEvent;
  error?: string;
}
