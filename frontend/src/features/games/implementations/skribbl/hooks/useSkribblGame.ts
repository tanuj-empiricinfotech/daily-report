/**
 * Skribbl Game Hook
 *
 * Hook for managing Skribbl-specific game state and actions.
 * Listens for game-specific socket events and maintains real-time state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '../../../core/hooks/useGameState';
import type {
  SkribblGameState,
  DrawStroke,
  DrawingToolSettings,
  SkribblAction,
} from '../types/skribbl.types';
import type { GameChatMessage } from '../../../core/types/game.types';

/**
 * Backend action type constants (must match backend SKRIBBL_ACTIONS)
 */
const ACTIONS = {
  PICK_WORD: 'PICK_WORD',
  SUBMIT_GUESS: 'SUBMIT_GUESS',
  DRAW_STROKE: 'DRAW_STROKE',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
  UNDO_STROKE: 'UNDO_STROKE',
} as const;

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

  // Real-time state for strokes and timer (updated between full state broadcasts)
  const [realtimeStrokes, setRealtimeStrokes] = useState<DrawStroke[]>([]);
  const [realtimeTime, setRealtimeTime] = useState<number | null>(null);

  // Sync real-time strokes with server state on phase changes
  const prevPhaseRef = useRef(rawGameState?.phase);
  useEffect(() => {
    if (rawGameState && rawGameState.phase !== prevPhaseRef.current) {
      setRealtimeStrokes(rawGameState.strokes || []);
      setRealtimeTime(rawGameState.turn?.timeRemaining ?? null);
      prevPhaseRef.current = rawGameState.phase;
    }
  }, [rawGameState]);

  // Also sync when raw state updates (full state broadcast)
  useEffect(() => {
    if (rawGameState?.strokes) {
      setRealtimeStrokes(rawGameState.strokes);
    }
    if (rawGameState?.turn?.timeRemaining != null) {
      setRealtimeTime(rawGameState.turn.timeRemaining);
    }
  }, [rawGameState]);

  // Build merged game state
  const gameState: SkribblGameState = rawGameState
    ? {
        ...rawGameState,
        strokes: realtimeStrokes,
        turn: rawGameState.turn
          ? {
              ...rawGameState.turn,
              timeRemaining: realtimeTime ?? rawGameState.turn.timeRemaining,
            }
          : undefined,
      }
    : {
        phase: 'lobby',
        round: { roundNumber: 0, totalRounds: 0, currentTurn: 0, totalTurns: 0 },
        strokes: [],
      };

  // Derived state
  const isDrawer = gameState.turn?.drawerId === currentUserId;
  const currentDrawer = players.find((p) => p.id === gameState.turn?.drawerId);
  const hasGuessed = gameState.turn?.playersGuessed?.includes(currentUserId ?? 0) ?? false;

  // =========================================================================
  // Actions (matching backend SKRIBBL_ACTIONS)
  // =========================================================================

  const chooseWord = useCallback(
    (word: string) => {
      createAction(ACTIONS.PICK_WORD, { word });
    },
    [createAction]
  );

  const sendDrawStroke = useCallback(
    (stroke: DrawStroke) => {
      createAction(ACTIONS.DRAW_STROKE, { stroke });
      // Optimistically add stroke locally (drawer won't receive broadcast)
      setRealtimeStrokes((prev) => [...prev, stroke]);
    },
    [createAction]
  );

  const clearCanvas = useCallback(() => {
    createAction(ACTIONS.CLEAR_CANVAS, {});
    setRealtimeStrokes([]);
  }, [createAction]);

  const undoStroke = useCallback(() => {
    createAction(ACTIONS.UNDO_STROKE, {});
    setRealtimeStrokes((prev) => prev.slice(0, -1));
  }, [createAction]);

  const submitGuess = useCallback(
    (guess: string) => {
      createAction(ACTIONS.SUBMIT_GUESS, { guess });
    },
    [createAction]
  );

  const skipTurn = useCallback(() => {
    createAction('SKIP_TURN', {});
  }, [createAction]);

  // =========================================================================
  // Real-time event listeners
  // =========================================================================

  useEffect(() => {
    // Drawing events (for non-drawers)
    const unsubStroke = onGameEvent('skribbl:stroke', (data: { stroke: DrawStroke }) => {
      setRealtimeStrokes((prev) => [...prev, data.stroke]);
    });

    const unsubClear = onGameEvent('skribbl:clear_canvas', () => {
      setRealtimeStrokes([]);
    });

    const unsubUndo = onGameEvent('skribbl:undo_stroke', () => {
      setRealtimeStrokes((prev) => prev.slice(0, -1));
    });

    // Timer tick
    const unsubTick = onGameEvent('skribbl:tick', (data: { timeRemaining: number }) => {
      setRealtimeTime(data.timeRemaining);
    });

    // Hint reveal
    const unsubHint = onGameEvent('skribbl:hint_reveal', (data: { hint: string }) => {
      // Hint updates come via game:state_update, but also handle the specific event
      // This is a no-op for now as the state broadcast handles it
      void data;
    });

    // Correct guess notification
    const unsubCorrect = onGameEvent(
      'skribbl:correct_guess',
      (data: { playerId: number; playerName: string; points: number }) => {
        const newMessage: GameChatMessage = {
          id: `correct-${Date.now()}-${data.playerId}`,
          playerId: data.playerId,
          playerName: data.playerName,
          content: `guessed the word! (+${data.points})`,
          type: 'correct',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    );

    // Wrong guess broadcast
    const unsubGuess = onGameEvent(
      'skribbl:guess',
      (data: { playerId: number; playerName: string; guess: string }) => {
        const newMessage: GameChatMessage = {
          id: `guess-${Date.now()}-${data.playerId}`,
          playerId: data.playerId,
          playerName: data.playerName,
          content: data.guess,
          type: 'guess',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    );

    // System messages (round start, etc.)
    const unsubSystem = onGameEvent('system_message', (data: { message: string }) => {
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
      unsubStroke();
      unsubClear();
      unsubUndo();
      unsubTick();
      unsubHint();
      unsubCorrect();
      unsubGuess();
      unsubSystem();
    };
  }, [onGameEvent]);

  // Clear messages on new round
  useEffect(() => {
    if (gameState.phase === 'round_start' || gameState.phase === 'starting') {
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
