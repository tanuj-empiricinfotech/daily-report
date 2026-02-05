/**
 * Games Module Entry Point
 *
 * Main entry point for the games platform.
 * Handles game registration and module initialization.
 */

// Re-export core components
export * from './core';

// Import game implementations for registration
import { registerAllGames } from './implementations';
import logger from '../utils/logger';

/**
 * Initialize the games module
 *
 * This should be called during server startup to:
 * 1. Register all available games
 * 2. Any other initialization needed
 */
export function initializeGamesModule(): void {
  logger.info('Initializing games module...');

  // Register all game implementations
  registerAllGames();

  logger.info('Games module initialized');
}
