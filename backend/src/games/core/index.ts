/**
 * Games Core Module Index
 *
 * Exports all core game framework components.
 */

// Interfaces
export * from './interfaces';

// Abstract base classes
export * from './abstracts';

// Services
export * from './services';

// Types
export * from './types/common.types';
export * from './types/events.types';

// Utilities
export * from './utils';

// Socket setup
export { initializeGameSocket, getGameNamespace, getRoomManager } from './socket/game.socket';
