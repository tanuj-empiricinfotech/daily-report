/**
 * Game Context Interface
 *
 * Provides games with access to room state and communication capabilities.
 * This abstraction decouples game logic from infrastructure concerns.
 */

import type { Player, GameSettings, Room } from '../types/common.types';

/**
 * Game context provided to all game methods
 *
 * This is the "god object" that games use to:
 * - Access room and player information
 * - Broadcast events to players
 * - Manage game state
 */
export interface GameContext {
  // =========================================================================
  // Room Information
  // =========================================================================

  /** The room this game is running in */
  readonly room: Room;

  /** Room code for identification */
  readonly roomCode: string;

  /** Team ID this room belongs to */
  readonly teamId: number;

  /** Current room settings */
  readonly settings: GameSettings;

  /** Whether a game is currently active */
  readonly isGameActive: boolean;

  // =========================================================================
  // Player Access
  // =========================================================================

  /** Map of all players in the room */
  readonly players: Map<number, Player>;

  /** Get a specific player by ID */
  getPlayer(playerId: number): Player | undefined;

  /** Get all connected player IDs */
  getConnectedPlayerIds(): number[];

  /** Get number of connected players */
  getConnectedPlayerCount(): number;

  // =========================================================================
  // State Management
  // =========================================================================

  /** Get the current game state */
  getState<T>(): T;

  /** Update the game state */
  setState<T>(state: T): void;

  /** Update partial game state */
  updateState<T>(partial: Partial<T>): void;

  // =========================================================================
  // Communication
  // =========================================================================

  /**
   * Broadcast an event to all players in the room
   *
   * @param event - Event name
   * @param data - Event data
   */
  broadcast(event: string, data: unknown): void;

  /**
   * Broadcast to all players except specified ones
   *
   * @param event - Event name
   * @param data - Event data
   * @param excludePlayerIds - Player IDs to exclude
   */
  broadcastExcept(event: string, data: unknown, excludePlayerIds: number | number[]): void;

  /**
   * Send an event to a specific player
   *
   * @param playerId - Target player ID
   * @param event - Event name
   * @param data - Event data
   */
  sendToPlayer(playerId: number, event: string, data: unknown): void;

  /**
   * Send an event to multiple specific players
   *
   * @param playerIds - Target player IDs
   * @param event - Event name
   * @param data - Event data
   */
  sendToPlayers(playerIds: number[], event: string, data: unknown): void;

  // =========================================================================
  // Game Control
  // =========================================================================

  /**
   * End the current game
   *
   * @param reason - Reason for ending (e.g., 'completed', 'not_enough_players')
   */
  endGame(reason: string): void;

  /**
   * Schedule a callback to run after a delay
   * Returns a function to cancel the scheduled callback
   *
   * @param callback - Function to call
   * @param delayMs - Delay in milliseconds
   * @returns Cancel function
   */
  scheduleTimeout(callback: () => void, delayMs: number): () => void;

  /**
   * Schedule a repeating callback
   * Returns a function to cancel the interval
   *
   * @param callback - Function to call
   * @param intervalMs - Interval in milliseconds
   * @returns Cancel function
   */
  scheduleInterval(callback: () => void, intervalMs: number): () => void;

  // =========================================================================
  // Scoring
  // =========================================================================

  /**
   * Add points to a player's score
   *
   * @param playerId - Player to award points to
   * @param points - Points to add
   */
  addScore(playerId: number, points: number): void;

  /**
   * Set a player's score to a specific value
   *
   * @param playerId - Player to set score for
   * @param score - New score value
   */
  setScore(playerId: number, score: number): void;

  /**
   * Get a player's current score
   *
   * @param playerId - Player ID
   */
  getScore(playerId: number): number;

  /**
   * Get all scores as an array sorted by score (descending)
   */
  getScoreBoard(): Array<{ playerId: number; score: number }>;
}
