/**
 * Skribbl Game Actions
 *
 * Type definitions for all Skribbl game actions.
 */

import type { GameAction } from '../../core/interfaces/game-action.interface';
import type { DrawStroke } from './skribbl.types';

/**
 * Action type constants
 */
export const SKRIBBL_ACTIONS = {
  PICK_WORD: 'PICK_WORD',
  SUBMIT_GUESS: 'SUBMIT_GUESS',
  DRAW_STROKE: 'DRAW_STROKE',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
  UNDO_STROKE: 'UNDO_STROKE',
} as const;

/**
 * Pick word action (drawer only)
 */
export interface PickWordAction extends GameAction {
  type: typeof SKRIBBL_ACTIONS.PICK_WORD;
  payload: {
    wordIndex: number;
  };
}

/**
 * Submit guess action (guessers only)
 */
export interface SubmitGuessAction extends GameAction {
  type: typeof SKRIBBL_ACTIONS.SUBMIT_GUESS;
  payload: {
    guess: string;
  };
}

/**
 * Draw stroke action (drawer only)
 */
export interface DrawStrokeAction extends GameAction {
  type: typeof SKRIBBL_ACTIONS.DRAW_STROKE;
  payload: {
    stroke: DrawStroke;
  };
}

/**
 * Clear canvas action (drawer only)
 */
export interface ClearCanvasAction extends GameAction {
  type: typeof SKRIBBL_ACTIONS.CLEAR_CANVAS;
  payload: Record<string, never>;
}

/**
 * Undo stroke action (drawer only)
 */
export interface UndoStrokeAction extends GameAction {
  type: typeof SKRIBBL_ACTIONS.UNDO_STROKE;
  payload: Record<string, never>;
}

/**
 * Union of all Skribbl actions
 */
export type SkribblAction =
  | PickWordAction
  | SubmitGuessAction
  | DrawStrokeAction
  | ClearCanvasAction
  | UndoStrokeAction;

/**
 * Type guards
 */
export function isPickWordAction(action: SkribblAction): action is PickWordAction {
  return action.type === SKRIBBL_ACTIONS.PICK_WORD;
}

export function isSubmitGuessAction(action: SkribblAction): action is SubmitGuessAction {
  return action.type === SKRIBBL_ACTIONS.SUBMIT_GUESS;
}

export function isDrawStrokeAction(action: SkribblAction): action is DrawStrokeAction {
  return action.type === SKRIBBL_ACTIONS.DRAW_STROKE;
}

export function isClearCanvasAction(action: SkribblAction): action is ClearCanvasAction {
  return action.type === SKRIBBL_ACTIONS.CLEAR_CANVAS;
}

export function isUndoStrokeAction(action: SkribblAction): action is UndoStrokeAction {
  return action.type === SKRIBBL_ACTIONS.UNDO_STROKE;
}
