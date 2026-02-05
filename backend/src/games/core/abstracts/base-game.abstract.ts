/**
 * Base Game Abstract Class
 *
 * Provides common functionality for all games.
 * Games should extend this class rather than implementing IGameDefinition directly.
 */

import type { IGameDefinition } from '../interfaces/game.interface';
import type { GameContext } from '../interfaces/game-context.interface';
import type { GameAction } from '../interfaces/game-action.interface';
import type {
  GameSettings,
  GameResult,
  ActionResult,
  Player,
  PublicPlayer,
} from '../types/common.types';

/**
 * Abstract base class for all games
 *
 * Provides:
 * - Common player sanitization
 * - Default lifecycle implementations
 * - Utility methods for games
 */
export abstract class BaseGame<
  TState = unknown,
  TAction extends GameAction = GameAction,
  TSettings extends GameSettings = GameSettings
> implements IGameDefinition<TState, TAction, TSettings> {
  // =========================================================================
  // Abstract Properties (must be implemented by subclasses)
  // =========================================================================

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly minPlayers: number;
  abstract readonly maxPlayers: number;
  abstract readonly defaultSettings: TSettings;

  // =========================================================================
  // Abstract Methods (must be implemented by subclasses)
  // =========================================================================

  abstract getInitialState(): TState;
  abstract getPublicState(context: GameContext, playerId: number): unknown;
  abstract onGameStart(context: GameContext): void | Promise<void>;
  abstract onGameEnd(context: GameContext): GameResult;
  abstract handleAction(context: GameContext, action: TAction): ActionResult | Promise<ActionResult>;

  // =========================================================================
  // Default Implementations (can be overridden)
  // =========================================================================

  /**
   * Default player join handler
   * Adds player to the context and broadcasts the join event
   */
  onPlayerJoin(context: GameContext, player: Player): void {
    context.broadcast('room:player_joined', {
      player: this.sanitizePlayer(player),
    });
  }

  /**
   * Default player leave handler
   * Removes player and checks if game should end
   */
  onPlayerLeave(context: GameContext, playerId: number): void {
    context.broadcast('room:player_left', {
      playerId,
      reason: 'left',
    });

    // Check if game should end due to insufficient players
    if (context.isGameActive && this.shouldEndGameOnLeave(context)) {
      context.endGame('not_enough_players');
    }
  }

  /**
   * Default player reconnect handler
   */
  onPlayerReconnect(context: GameContext, playerId: number): void {
    context.broadcast('room:player_reconnected', { playerId });

    // Send current game state to reconnected player
    if (context.isGameActive) {
      const state = this.getPublicState(context, playerId);
      context.sendToPlayer(playerId, 'game:state_update', { state });
    }
  }

  /**
   * Default settings update handler
   */
  onSettingsUpdate(context: GameContext, newSettings: TSettings): void {
    context.broadcast('room:settings_updated', { settings: newSettings });
  }

  /**
   * Default game start validation
   */
  validateGameStart(context: GameContext): string | undefined {
    const playerCount = context.getConnectedPlayerCount();

    if (playerCount < this.minPlayers) {
      return `Need at least ${this.minPlayers} players to start (have ${playerCount})`;
    }

    if (playerCount > this.maxPlayers) {
      return `Too many players (max ${this.maxPlayers}, have ${playerCount})`;
    }

    return undefined;
  }

  /**
   * Optional cleanup method
   */
  cleanup(): void {
    // Default: no cleanup needed
  }

  // =========================================================================
  // Protected Utility Methods
  // =========================================================================

  /**
   * Check if game should end when a player leaves
   * Override to customize this behavior
   */
  protected shouldEndGameOnLeave(context: GameContext): boolean {
    return context.getConnectedPlayerCount() < this.minPlayers;
  }

  /**
   * Sanitize player data for public broadcast
   * Removes sensitive information like socketId
   */
  protected sanitizePlayer(player: Player): PublicPlayer {
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
   * Sanitize multiple players
   */
  protected sanitizePlayers(players: Iterable<Player>): PublicPlayer[] {
    return Array.from(players).map((p) => this.sanitizePlayer(p));
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  protected shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Pick random items from an array
   */
  protected pickRandom<T>(array: T[], count: number): T[] {
    return this.shuffle(array).slice(0, count);
  }

  /**
   * Delay execution (promisified setTimeout)
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clamp a number between min and max
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Calculate percentage
   */
  protected percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
}
