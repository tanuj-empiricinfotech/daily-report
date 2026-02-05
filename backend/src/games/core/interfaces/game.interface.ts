/**
 * Game Interface
 *
 * Contract that all games must implement to integrate with the platform.
 * This is the core abstraction that enables the plugin architecture.
 */

import type { GameContext } from './game-context.interface';
import type { GameAction } from './game-action.interface';
import type {
  GameSettings,
  GameResult,
  ActionResult,
  Player,
} from '../types/common.types';

/**
 * Main game definition interface
 *
 * Each game implements this interface to define its identity,
 * constraints, and behavior.
 */
export interface IGameDefinition<
  TState = unknown,
  TAction extends GameAction = GameAction,
  TSettings extends GameSettings = GameSettings
> {
  // =========================================================================
  // Identity
  // =========================================================================

  /** Unique identifier for the game (e.g., 'skribbl', 'trivia') */
  readonly id: string;

  /** Display name for the game */
  readonly name: string;

  /** Brief description of the game */
  readonly description: string;

  // =========================================================================
  // Constraints
  // =========================================================================

  /** Minimum players required to start */
  readonly minPlayers: number;

  /** Maximum players allowed in a room */
  readonly maxPlayers: number;

  /** Default settings for new rooms */
  readonly defaultSettings: TSettings;

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Create initial game state
   * Called when a new game instance is created
   */
  getInitialState(): TState;

  /**
   * Get the public state visible to a specific player
   * Used to hide sensitive information (e.g., answers, other players' cards)
   *
   * @param context - Game context with room and player info
   * @param playerId - The player requesting the state
   */
  getPublicState(context: GameContext, playerId: number): unknown;

  // =========================================================================
  // Lifecycle Hooks
  // =========================================================================

  /**
   * Called when a player joins the room
   *
   * @param context - Game context
   * @param player - The player who joined
   */
  onPlayerJoin(context: GameContext, player: Player): void;

  /**
   * Called when a player leaves the room
   *
   * @param context - Game context
   * @param playerId - ID of the player who left
   */
  onPlayerLeave(context: GameContext, playerId: number): void;

  /**
   * Called when the game starts
   * Initialize game state, deal cards, set up rounds, etc.
   *
   * @param context - Game context
   */
  onGameStart(context: GameContext): void | Promise<void>;

  /**
   * Called when the game ends
   * Calculate final scores, determine winner, etc.
   *
   * @param context - Game context
   * @returns Final game result
   */
  onGameEnd(context: GameContext): GameResult;

  // =========================================================================
  // Action Handling
  // =========================================================================

  /**
   * Handle a player action
   * This is the main entry point for game logic.
   *
   * @param context - Game context
   * @param action - The action to handle
   * @returns Result of the action
   */
  handleAction(context: GameContext, action: TAction): ActionResult | Promise<ActionResult>;

  // =========================================================================
  // Optional Hooks
  // =========================================================================

  /**
   * Called when a player reconnects after disconnection
   *
   * @param context - Game context
   * @param playerId - ID of the reconnected player
   */
  onPlayerReconnect?(context: GameContext, playerId: number): void;

  /**
   * Called when room settings are updated
   *
   * @param context - Game context
   * @param newSettings - The new settings
   */
  onSettingsUpdate?(context: GameContext, newSettings: TSettings): void;

  /**
   * Validate if the game can start with current players and settings
   *
   * @param context - Game context
   * @returns Error message if cannot start, undefined if OK
   */
  validateGameStart?(context: GameContext): string | undefined;

  /**
   * Clean up resources when game/room is destroyed
   */
  cleanup?(): void;
}
