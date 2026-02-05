/**
 * Game Implementations Index
 *
 * Registers all available games with the game registry.
 */

import { gameRegistry } from '../core/services/game-registry.service';
import { SkribblGame } from './skribbl/skribbl.game';
import logger from '../../utils/logger';

/**
 * Register all game implementations
 *
 * Add new games here as they are implemented.
 */
export function registerAllGames(): void {
  logger.info('Registering game implementations...');

  // Register Skribbl
  gameRegistry.register(new SkribblGame());

  // Future games:
  // gameRegistry.register(new TriviaGame());
  // gameRegistry.register(new CodenamesGame());

  logger.info(`Registered ${gameRegistry.count} game(s)`);
}
