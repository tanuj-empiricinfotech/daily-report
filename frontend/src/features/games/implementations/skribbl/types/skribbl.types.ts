/**
 * Skribbl Game Types
 *
 * Type definitions specific to the Skribbl drawing game.
 */

import type { GameSettings } from '../../../core/types/game.types';

/**
 * Skribbl game phase
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
 * Skribbl game settings
 */
export interface SkribblSettings extends GameSettings {
  rounds: number;
  drawTime: number;
  wordCount: number;
  hintsEnabled: boolean;
  customWordsOnly: boolean;
  customWords: string[];
}

/**
 * Word choice for the drawer
 */
export interface WordChoice {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Hint for guessers
 */
export interface WordHint {
  pattern: string; // e.g., "_ _ _ e r" for "tiger"
  revealedCount: number;
  totalLength: number;
}

/**
 * Drawing stroke point
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Drawing stroke data
 */
export interface DrawStroke {
  points: Point[];
  color: string;
  size: number;
  tool: 'brush' | 'eraser';
}

/**
 * Drawing action from backend
 */
export interface DrawAction {
  type: 'draw' | 'clear' | 'undo' | 'fill';
  stroke?: DrawStroke;
}

/**
 * Turn result for a player
 */
export interface PlayerTurnResult {
  playerId: number;
  playerName: string;
  guessed: boolean;
  points: number;
  guessTime?: number;
}

/**
 * Turn state
 */
export interface TurnState {
  drawerId: number;
  drawerName: string;
  word?: string; // Only visible to drawer
  hint: WordHint;
  timeRemaining: number;
  playersGuessed: number[];
}

/**
 * Round state
 */
export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  currentTurn: number;
  totalTurns: number;
}

/**
 * Full Skribbl game state from backend
 */
export interface SkribblGameState {
  phase: SkribblPhase;
  round: RoundState;
  turn?: TurnState;
  wordChoices?: WordChoice[]; // Only for drawer during picking_word
  turnResults?: PlayerTurnResult[];
  strokes: DrawStroke[];
  countdown?: number;
}

/**
 * Skribbl action types
 */
export type SkribblActionType =
  | 'choose_word'
  | 'draw'
  | 'clear_canvas'
  | 'undo'
  | 'guess'
  | 'skip_turn';

/**
 * Skribbl game action
 */
export interface SkribblAction {
  type: SkribblActionType;
  payload: Record<string, unknown>;
}

/**
 * Canvas drawing tool
 */
export type DrawingTool = 'brush' | 'eraser' | 'fill';

/**
 * Drawing tool settings
 */
export interface DrawingToolSettings {
  tool: DrawingTool;
  color: string;
  size: number;
}

/**
 * Color palette
 */
export const SKRIBBL_COLORS = [
  '#FFFFFF', '#C1C1C1', '#EF130B', '#FF7100', '#FFE400',
  '#00CC00', '#00B2FF', '#231FD3', '#A300BA', '#D37CAA',
  '#A0522D', '#000000', '#4C4C4C', '#740B07', '#C23800',
  '#E8A200', '#005510', '#00569E', '#0E0865', '#550069',
  '#A75574', '#63300D',
] as const;

/**
 * Brush sizes
 */
export const BRUSH_SIZES = [4, 8, 16, 32, 48] as const;
