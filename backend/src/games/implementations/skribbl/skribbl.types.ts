/**
 * Skribbl Game Types
 *
 * Type definitions for Skribbl game state.
 */

/**
 * Game phases
 */
export type SkribblPhase =
  | 'lobby'
  | 'starting'
  | 'round_start'
  | 'picking_word'
  | 'drawing'
  | 'turn_results'
  | 'game_over';

/**
 * Drawing stroke data
 */
export interface DrawStroke {
  id: string;
  points: Point[];
  color: string;
  brushSize: number;
  tool: DrawTool;
  timestamp: number;
}

/**
 * Point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Drawing tools
 */
export type DrawTool = 'brush' | 'eraser' | 'fill';

/**
 * Chat message in game
 */
export interface GameChatMessage {
  id: string;
  playerId: number;
  playerName: string;
  content: string;
  type: 'guess' | 'correct' | 'close' | 'system';
  timestamp: number;
}

/**
 * Turn result data
 */
export interface TurnResult {
  word: string;
  drawerId: number;
  guessedPlayers: number[];
  scores: Array<{ playerId: number; points: number }>;
}

/**
 * Main Skribbl game state
 */
export interface SkribblState {
  phase: SkribblPhase;

  // Round/Turn tracking
  currentRound: number;
  totalRounds: number;
  currentTurnIndex: number;
  turnOrder: number[];

  // Current turn state
  drawerId: number | null;
  currentWord: string | null;
  wordOptions: string[];
  turnStartTime: number | null;
  timeRemaining: number;

  // Drawing state
  strokes: DrawStroke[];

  // Guessing state
  guessedPlayers: Set<number>;
  hintsRevealed: number;

  // Chat messages
  messages: GameChatMessage[];

  // Last turn results (for display)
  lastTurnResult: TurnResult | null;
}

/**
 * Create initial Skribbl state
 */
export function createInitialSkribblState(): SkribblState {
  return {
    phase: 'lobby',
    currentRound: 0,
    totalRounds: 3,
    currentTurnIndex: -1,
    turnOrder: [],
    drawerId: null,
    currentWord: null,
    wordOptions: [],
    turnStartTime: null,
    timeRemaining: 0,
    strokes: [],
    guessedPlayers: new Set(),
    hintsRevealed: 0,
    messages: [],
    lastTurnResult: null,
  };
}

/**
 * Public state (safe to send to players)
 */
export interface SkribblPublicState {
  phase: SkribblPhase;
  currentRound: number;
  totalRounds: number;
  drawerId: number | null;
  timeRemaining: number;
  hint: string | null;
  strokes: DrawStroke[];
  guessedPlayers: number[];
  messages: GameChatMessage[];
  lastTurnResult: TurnResult | null;

  // Only for drawer
  currentWord?: string;
  wordOptions?: string[];
}
