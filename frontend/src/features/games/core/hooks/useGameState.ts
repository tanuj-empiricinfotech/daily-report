/**
 * Game State Hook
 *
 * Generic hook for game-specific state and actions.
 */

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { useGameSocket } from './useGameSocket';
import type { GameAction } from '../types/game.types';

/**
 * Generic hook for accessing game state and sending actions
 *
 * @template TState - Game-specific state type
 * @template TAction - Game-specific action type
 */
export function useGameState<TState, TAction extends GameAction = GameAction>() {
  const { sendAction, onGameEvent, isConnected } = useGameSocket();

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const gameState = useSelector((state: RootState) => state.game.gameState as TState);
  const players = useSelector((state: RootState) => state.game.players);
  const isGameActive = useSelector((state: RootState) => state.game.isGameActive);
  const hostId = useSelector((state: RootState) => state.game.hostId);

  /**
   * Send a typed game action
   */
  const dispatchAction = useCallback(
    (action: Omit<TAction, 'playerId'>) => {
      sendAction(action.type, action.payload);
    },
    [sendAction]
  );

  /**
   * Helper to create and send an action
   */
  const createAction = useCallback(
    <T extends Record<string, unknown>>(type: string, payload: T) => {
      sendAction(type, payload);
    },
    [sendAction]
  );

  return {
    // State
    gameState,
    players,
    currentUserId,
    isGameActive,
    hostId,
    isConnected,

    // Computed
    isHost: currentUserId === hostId,

    // Actions
    sendAction: dispatchAction,
    createAction,
    onGameEvent,
  };
}
