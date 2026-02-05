/**
 * Common Types for Games Platform
 *
 * Shared type definitions used across all games.
 */

/**
 * Player representation in a game room
 */
export interface Player {
  id: number;
  name: string;
  avatarUrl?: string;
  socketId: string;
  isReady: boolean;
  isConnected: boolean;
  score: number;
  joinedAt: Date;
}

/**
 * Sanitized player data (without sensitive info like socketId)
 */
export interface PublicPlayer {
  id: number;
  name: string;
  avatarUrl?: string;
  isReady: boolean;
  isConnected: boolean;
  score: number;
}

/**
 * Game room state
 */
export interface Room {
  code: string;
  gameId: string;
  teamId: number;
  hostId: number;
  players: Map<number, Player>;
  settings: GameSettings;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Room status enum
 */
export type RoomStatus = 'lobby' | 'starting' | 'active' | 'finished' | 'abandoned';

/**
 * Base game settings (extended by each game)
 */
export interface GameSettings {
  [key: string]: unknown;
}

/**
 * Result returned when a game ends
 */
export interface GameResult {
  winnerId: number | null;
  finalScores: PlayerScore[];
  stats: Record<string, unknown>;
  duration: number;
}

/**
 * Player score entry
 */
export interface PlayerScore {
  playerId: number;
  score: number;
  rank?: number;
}

/**
 * Result of handling an action
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Game info for listing available games
 */
export interface GameInfo {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  iconUrl?: string;
}

/**
 * Create room options
 */
export interface CreateRoomOptions {
  gameId: string;
  teamId: number;
  hostId: number;
  hostName: string;
  settings?: Partial<GameSettings>;
}

/**
 * Join room options
 */
export interface JoinRoomOptions {
  roomCode: string;
  userId: number;
  userName: string;
}
