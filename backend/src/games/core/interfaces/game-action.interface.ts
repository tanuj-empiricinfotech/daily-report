/**
 * Game Action Interface
 *
 * Base interface for all game actions.
 * Each game extends this to define its specific action types.
 */

/**
 * Base game action interface
 *
 * All game-specific actions must extend this interface.
 */
export interface GameAction {
  /** Action type identifier */
  type: string;

  /** Player who initiated the action */
  playerId: number;

  /** Action-specific payload */
  payload: Record<string, unknown>;

  /** Timestamp when action was created */
  timestamp?: number;
}

/**
 * Type guard to check if an object is a valid GameAction
 */
export function isGameAction(obj: unknown): obj is GameAction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as GameAction).type === 'string' &&
    typeof (obj as GameAction).playerId === 'number' &&
    typeof (obj as GameAction).payload === 'object'
  );
}

/**
 * Create a typed action creator for a specific action type
 *
 * @example
 * const submitAnswer = createAction<{ answer: string }>('SUBMIT_ANSWER');
 * const action = submitAnswer(1, { answer: 'Paris' });
 */
export function createAction<TPayload extends Record<string, unknown>>(type: string) {
  return (playerId: number, payload: TPayload): GameAction & { payload: TPayload } => ({
    type,
    playerId,
    payload,
    timestamp: Date.now(),
  });
}
