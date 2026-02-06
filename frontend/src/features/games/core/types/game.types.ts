/**
 * Game Types for Frontend
 *
 * Type definitions shared across all games.
 */

/**
 * Player in a game room
 */
export interface Player {
  id: number;
  name: string;
  avatarUrl?: string;
  isReady: boolean;
  isConnected: boolean;
  score: number;
}

/**
 * Game info for display
 */
export interface GameInfo {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

/**
 * Room status
 */
export type RoomStatus = 'lobby' | 'starting' | 'active' | 'finished' | 'abandoned';

/**
 * Room state
 */
export interface RoomState {
  roomCode: string;
  gameId: string;
  gameInfo: GameInfo;
  players: Player[];
  settings: GameSettings;
  hostId: number;
  status: RoomStatus;
  isHost: boolean;
}

/**
 * Game settings (base)
 */
export interface GameSettings {
  [key: string]: unknown;
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
 * Game result
 */
export interface GameResult {
  winnerId: number | null;
  finalScores: PlayerScore[];
  stats: Record<string, unknown>;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Game action (base)
 */
export interface GameAction {
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Chat message in game
 */
export interface GameChatMessage {
  id: string;
  playerId: number;
  playerName: string;
  content: string;
  type: 'guess' | 'correct' | 'close' | 'system';
  timestamp: number;
}
