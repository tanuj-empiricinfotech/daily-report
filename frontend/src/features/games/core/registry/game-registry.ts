/**
 * Game Registry for Frontend
 *
 * Registers game components and metadata for dynamic rendering.
 */

import type { ComponentType } from 'react';
import type { GameInfo, GameSettings } from '../types/game.types';

/**
 * Settings schema for a game setting field
 */
export interface SettingSchema {
  type: 'number' | 'select' | 'boolean' | 'string';
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  default: unknown;
}

/**
 * Settings schema for a game
 */
export type SettingsSchema = Record<string, SettingSchema>;

/**
 * Props passed to game components
 */
export interface GameComponentProps {
  /** Called when the player wants to leave the game */
  onLeave: () => void;
}

/**
 * Props passed to lobby settings components
 */
export interface LobbySettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  disabled: boolean;
}

/**
 * Game registration object
 */
export interface GameRegistration {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  component: ComponentType<GameComponentProps>;
  lobbyComponent?: ComponentType<LobbySettingsProps>;
  settingsSchema: SettingsSchema;
  minPlayers: number;
  maxPlayers: number;
}

/**
 * Game registry singleton
 */
class GameRegistry {
  private games: Map<string, GameRegistration> = new Map();

  /**
   * Register a game
   */
  register(game: GameRegistration): void {
    this.games.set(game.id, game);
  }

  /**
   * Get a game by ID
   */
  get(gameId: string): GameRegistration | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get all registered games
   */
  getAll(): GameRegistration[] {
    return Array.from(this.games.values());
  }

  /**
   * Get game component by ID
   */
  getComponent(gameId: string): ComponentType<GameComponentProps> | null {
    return this.games.get(gameId)?.component || null;
  }

  /**
   * Get lobby settings component by ID
   */
  getLobbyComponent(gameId: string): ComponentType<LobbySettingsProps> | null {
    return this.games.get(gameId)?.lobbyComponent || null;
  }

  /**
   * Get game info for display
   */
  getGameInfo(gameId: string): GameInfo | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    return {
      id: game.id,
      name: game.name,
      description: game.description,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
    };
  }

  /**
   * Check if a game is registered
   */
  has(gameId: string): boolean {
    return this.games.has(gameId);
  }
}

// Export singleton instance
export const gameRegistry = new GameRegistry();
