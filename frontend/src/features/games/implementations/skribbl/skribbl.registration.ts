/**
 * Skribbl Game Registration
 *
 * Registers the Skribbl game with the game registry.
 */

import { IconPencil } from '@tabler/icons-react';
import { gameRegistry, type GameRegistration } from '../../core/registry/game-registry';
import { SkribblGame } from './components/SkribblGame';
import { SkribblLobbySettings } from './components/SkribblLobbySettings';
import type { SkribblSettings } from './types/skribbl.types';

/**
 * Default Skribbl settings
 */
const DEFAULT_SETTINGS: SkribblSettings = {
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hintsEnabled: true,
  customWordsOnly: false,
  customWords: [],
};

/**
 * Skribbl game registration
 */
const skribblRegistration: GameRegistration = {
  id: 'skribbl',
  name: 'Skribbl',
  description: 'Draw and guess words with your team! Take turns drawing while others guess.',
  icon: IconPencil,
  component: SkribblGame,
  lobbyComponent: SkribblLobbySettings,
  settingsSchema: {
    rounds: {
      type: 'select',
      label: 'Rounds',
      description: 'Number of rounds to play',
      options: [
        { value: '2', label: '2 rounds' },
        { value: '3', label: '3 rounds' },
        { value: '4', label: '4 rounds' },
        { value: '5', label: '5 rounds' },
        { value: '6', label: '6 rounds' },
      ],
      default: 3,
    },
    drawTime: {
      type: 'select',
      label: 'Draw Time',
      description: 'Time to draw each word',
      options: [
        { value: '30', label: '30 seconds' },
        { value: '60', label: '60 seconds' },
        { value: '80', label: '80 seconds' },
        { value: '90', label: '90 seconds' },
        { value: '120', label: '120 seconds' },
      ],
      default: 80,
    },
    wordCount: {
      type: 'select',
      label: 'Word Choices',
      description: 'Number of words to choose from',
      options: [
        { value: '2', label: '2 words' },
        { value: '3', label: '3 words' },
        { value: '4', label: '4 words' },
      ],
      default: 3,
    },
    hintsEnabled: {
      type: 'boolean',
      label: 'Enable Hints',
      description: 'Reveal letters as time passes',
      default: true,
    },
  },
  minPlayers: 2,
  maxPlayers: 12,
};

/**
 * Register Skribbl game
 */
export function registerSkribbl(): void {
  gameRegistry.register(skribblRegistration);
}

/**
 * Get default Skribbl settings
 */
export function getDefaultSkribblSettings(): SkribblSettings {
  return { ...DEFAULT_SETTINGS };
}
