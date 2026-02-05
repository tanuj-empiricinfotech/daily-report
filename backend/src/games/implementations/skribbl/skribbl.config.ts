/**
 * Skribbl Game Configuration
 *
 * Constants and default settings for the Skribbl drawing game.
 */

/**
 * Game configuration constants
 */
export const SKRIBBL_CONFIG = {
  // Game identity
  id: 'skribbl',
  name: 'Skribbl',
  description: 'Draw and guess words with your team! One player draws while others try to guess the word.',

  // Player limits
  minPlayers: 2,
  maxPlayers: 8,

  // Timing (in seconds)
  drawTime: 80,
  wordPickTime: 15,
  turnResultsTime: 4,
  gameStartCountdown: 3,

  // Word options
  wordOptionsCount: 3,

  // Hint reveals (at these remaining seconds)
  hintRevealTimes: [50, 25],

  // Scoring
  scoring: {
    // Guesser points (decreases over time)
    maxGuesserPoints: 500,
    minGuesserPoints: 100,

    // Drawer points
    drawerPointsPerGuess: 50,
    drawerBonusAllGuessed: 100,
  },

  // Default settings (user-configurable)
  defaultSettings: {
    rounds: 3,
    drawTime: 80,
    wordDifficulty: 'medium' as const,
    customWords: [] as string[],
    hintsEnabled: true,
  },
} as const;

/**
 * Type for Skribbl settings
 */
export type SkribblSettings = typeof SKRIBBL_CONFIG.defaultSettings;

/**
 * Word difficulty levels
 */
export type WordDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Calculate guesser points based on elapsed time
 */
export function calculateGuesserPoints(elapsedSeconds: number, totalSeconds: number): number {
  const { maxGuesserPoints, minGuesserPoints } = SKRIBBL_CONFIG.scoring;
  const timeRatio = 1 - elapsedSeconds / totalSeconds;
  const pointRange = maxGuesserPoints - minGuesserPoints;
  return Math.floor(minGuesserPoints + pointRange * timeRatio);
}
