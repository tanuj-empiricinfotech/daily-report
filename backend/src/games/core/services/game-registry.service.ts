/**
 * Game Registry Service
 *
 * Central registry for all available games.
 * Games register themselves at startup and are discovered through this service.
 */

import type { IGameDefinition } from '../interfaces/game.interface';
import type { GameInfo } from '../types/common.types';
import logger from '../../../utils/logger';

/**
 * Singleton game registry
 *
 * All games must register with this service to be available for play.
 */
class GameRegistryService {
  private static instance: GameRegistryService;
  private games: Map<string, IGameDefinition> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): GameRegistryService {
    if (!GameRegistryService.instance) {
      GameRegistryService.instance = new GameRegistryService();
    }
    return GameRegistryService.instance;
  }

  /**
   * Register a game with the registry
   *
   * @param game - The game definition to register
   * @throws Error if game with same ID is already registered
   */
  register(game: IGameDefinition): void {
    if (this.games.has(game.id)) {
      throw new Error(`Game "${game.id}" is already registered`);
    }

    this.games.set(game.id, game);
    logger.info(`Game registered: ${game.id} (${game.name})`);
  }

  /**
   * Unregister a game (mainly for testing)
   *
   * @param gameId - The game ID to unregister
   */
  unregister(gameId: string): void {
    if (this.games.delete(gameId)) {
      logger.info(`Game unregistered: ${gameId}`);
    }
  }

  /**
   * Get a game by ID
   *
   * @param gameId - The game ID to retrieve
   * @returns The game definition or undefined
   */
  get(gameId: string): IGameDefinition | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get a game by ID, throwing if not found
   *
   * @param gameId - The game ID to retrieve
   * @throws Error if game not found
   */
  getOrThrow(gameId: string): IGameDefinition {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game "${gameId}" not found in registry`);
    }
    return game;
  }

  /**
   * Check if a game is registered
   *
   * @param gameId - The game ID to check
   */
  has(gameId: string): boolean {
    return this.games.has(gameId);
  }

  /**
   * Get all registered games
   */
  getAll(): IGameDefinition[] {
    return Array.from(this.games.values());
  }

  /**
   * Get all game IDs
   */
  getAllIds(): string[] {
    return Array.from(this.games.keys());
  }

  /**
   * Get public info for all games (for listing in UI)
   */
  getAvailableGames(): GameInfo[] {
    return this.getAll().map((game) => ({
      id: game.id,
      name: game.name,
      description: game.description,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
    }));
  }

  /**
   * Get count of registered games
   */
  get count(): number {
    return this.games.size;
  }

  /**
   * Clear all registered games (for testing)
   */
  clear(): void {
    this.games.clear();
    logger.info('Game registry cleared');
  }
}

// Export singleton instance
export const gameRegistry = GameRegistryService.getInstance();

// Also export the class for type purposes
export { GameRegistryService };
