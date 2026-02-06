/**
 * Skribbl Game Hook
 *
 * Hook for managing Skribbl-specific game state and actions.
 */

import { useCallback, useEffect, useState } from 'react';
import { useGameState } from '../../../core/hooks/useGameState';
import type {
  SkribblGameState,
  DrawStroke,
  DrawingToolSettings,
  SkribblAction,
} from '../types/skribbl.types';
import type { GameChatMessage } from '../../../core/types/game.types';

/**
 * Default drawing tool settings
 */
const DEFAULT_TOOL_SETTINGS: DrawingToolSettings = {
  tool: 'brush',
  color: '#000000',
  size: 8,
};

export function useSkribblGame() {
  const {
    gameState: rawGameState,
    players,
    currentUserId,
    isGameActive,
    isConnected,
    createAction,
    onGameEvent,
  } = useGameState<SkribblGameState, SkribblAction>();

  const [toolSettings, setToolSettings] = useState<DrawingToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [messages, setMessages] = useState<GameChatMessage[]>([]);

  // Parsed game state with defaults
  const gameState: SkribblGameState = rawGameState ?? {
    phase: 'lobby',
    round: { roundNumber: 0, totalRounds: 0, currentTurn: 0, totalTurns: 0 },
    strokes: [],
  };

  // Derived state
  const isDrawer = gameState.turn?.drawerId === currentUserId;
  const currentDrawer = players.find((p) => p.id === gameState.turn?.drawerId);
  const hasGuessed = gameState.turn?.playersGuessed.includes(currentUserId ?? 0) ?? false;

  // Choose word action
  const chooseWord = useCallback(
    (word: string) => {
      createAction('choose_word', { word });
    },
    [createAction]
  );

  // Draw action
  const sendDrawStroke = useCallback(
    (stroke: DrawStroke) => {
      createAction('draw', { stroke });
    },
    [createAction]
  );

  // Clear canvas action
  const clearCanvas = useCallback(() => {
    createAction('clear_canvas', {});
  }, [createAction]);

  // Undo last stroke
  const undoStroke = useCallback(() => {
    createAction('undo', {});
  }, [createAction]);

  // Submit guess
  const submitGuess = useCallback(
    (guess: string) => {
      createAction('guess', { guess });
    },
    [createAction]
  );

  // Skip turn (if allowed)
  const skipTurn = useCallback(() => {
    createAction('skip_turn', {});
  }, [createAction]);

  // Listen for game events
  useEffect(() => {
    const unsubscribeChat = onGameEvent('chat_message', (data: GameChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    const unsubscribeGuess = onGameEvent('guess_result', (data: {
      playerId: number;
      playerName: string;
      correct: boolean;
      close: boolean;
      guess: string;
    }) => {
      const newMessage: GameChatMessage = {
        id: `${Date.now()}-${data.playerId}`,
        playerId: data.playerId,
        playerName: data.playerName,
        content: data.correct ? 'Guessed the word!' : data.guess,
        type: data.correct ? 'correct' : data.close ? 'close' : 'guess',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    const unsubscribeSystem = onGameEvent('system_message', (data: { message: string }) => {
      const newMessage: GameChatMessage = {
        id: `system-${Date.now()}`,
        playerId: 0,
        playerName: 'System',
        content: data.message,
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      unsubscribeChat();
      unsubscribeGuess();
      unsubscribeSystem();
    };
  }, [onGameEvent]);

  // Clear messages on new round
  useEffect(() => {
    if (gameState.phase === 'round_start') {
      setMessages([]);
    }
  }, [gameState.phase]);

  return {
    // Game state
    gameState,
    players,
    currentUserId,
    isGameActive,
    isConnected,

    // Derived state
    isDrawer,
    currentDrawer,
    hasGuessed,
    messages,

    // Tool settings
    toolSettings,
    setToolSettings,

    // Actions
    chooseWord,
    sendDrawStroke,
    clearCanvas,
    undoStroke,
    submitGuess,
    skipTurn,
  };
}
