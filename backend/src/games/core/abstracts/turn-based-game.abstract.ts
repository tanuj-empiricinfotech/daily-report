/**
 * Turn-Based Game Abstract Class
 *
 * Extends BaseGame with turn and round management functionality.
 * Use this for games where players take turns (Skribbl, Pictionary, etc.)
 */

import { BaseGame } from './base-game.abstract';
import type { GameContext } from '../interfaces/game-context.interface';
import type { GameAction } from '../interfaces/game-action.interface';
import type { GameSettings, GameResult } from '../types/common.types';

/**
 * Turn state tracking
 */
export interface TurnState {
  currentRound: number;
  totalRounds: number;
  currentTurnIndex: number;
  turnOrder: number[];
  turnStartTime: number | null;
  timeRemaining: number;
}

/**
 * Abstract base class for turn-based games
 *
 * Provides:
 * - Round management
 * - Turn order and rotation
 * - Timer management
 * - Common turn lifecycle hooks
 */
export abstract class TurnBasedGame<
  TState = unknown,
  TAction extends GameAction = GameAction,
  TSettings extends GameSettings = GameSettings
> extends BaseGame<TState, TAction, TSettings> {
  // =========================================================================
  // Abstract Properties (must be set by subclass)
  // =========================================================================

  /** Duration of each turn in seconds */
  protected abstract turnDuration: number;

  /** Total number of rounds */
  protected abstract totalRounds: number;

  // =========================================================================
  // Turn State
  // =========================================================================

  protected turnState: TurnState = {
    currentRound: 0,
    totalRounds: 0,
    currentTurnIndex: -1,
    turnOrder: [],
    turnStartTime: null,
    timeRemaining: 0,
  };

  /** Cancel functions for active timers */
  private turnTimerCancel: (() => void) | null = null;
  private tickIntervalCancel: (() => void) | null = null;

  // =========================================================================
  // Abstract Turn Methods (must be implemented by subclass)
  // =========================================================================

  /**
   * Called when a player's turn begins
   * Set up turn-specific state, send word options, etc.
   */
  protected abstract onTurnStart(context: GameContext, playerId: number): void | Promise<void>;

  /**
   * Called when a turn ends normally (not timeout)
   * Process results, show answer, etc.
   */
  protected abstract onTurnEnd(context: GameContext): void;

  /**
   * Called when turn timer expires
   * Handle timeout scenario
   */
  protected abstract onTurnTimeout(context: GameContext): void;

  // =========================================================================
  // Turn-Based Game Implementation
  // =========================================================================

  /**
   * Start the game
   * Initializes rounds and starts the first turn
   */
  async onGameStart(context: GameContext): Promise<void> {
    // Initialize turn state
    this.turnState.totalRounds = (context.settings as { rounds?: number }).rounds || this.totalRounds;
    this.turnState.currentRound = 0;
    this.turnState.currentTurnIndex = -1;

    // Determine turn order (randomized)
    this.turnState.turnOrder = this.determineTurnOrder(context);

    // Initialize scores
    for (const playerId of context.players.keys()) {
      context.setScore(playerId, 0);
    }

    // Broadcast game started with initial state
    context.broadcast('game:started', {
      gameState: {
        phase: 'starting',
        round: {
          roundNumber: 0,
          totalRounds: this.turnState.totalRounds,
          currentTurn: 0,
          totalTurns: this.turnState.turnOrder.length,
        },
        strokes: [],
      },
    });

    // Start first round
    await this.startNextRound(context);
  }

  /**
   * Determine the order players will take turns
   * Override to customize (e.g., based on score, joining order)
   */
  protected determineTurnOrder(context: GameContext): number[] {
    return this.shuffle(Array.from(context.players.keys()));
  }

  /**
   * Start the next round
   */
  protected async startNextRound(context: GameContext): Promise<void> {
    this.turnState.currentRound++;
    this.turnState.currentTurnIndex = -1;

    // Check if game is complete
    if (this.turnState.currentRound > this.turnState.totalRounds) {
      context.endGame('completed');
      return;
    }

    // Broadcast round start
    context.broadcast(`${this.id}:round_start`, {
      round: this.turnState.currentRound,
      totalRounds: this.turnState.totalRounds,
    });

    // Small delay before first turn
    await this.delay(2000);

    // Start first turn of the round
    await this.startNextTurn(context);
  }

  /**
   * Start the next turn
   */
  protected async startNextTurn(context: GameContext): Promise<void> {
    this.turnState.currentTurnIndex++;

    // Check if round is complete (all players had a turn)
    if (this.turnState.currentTurnIndex >= this.turnState.turnOrder.length) {
      await this.startNextRound(context);
      return;
    }

    const currentPlayerId = this.getCurrentPlayerId();

    // Skip disconnected players
    const player = context.getPlayer(currentPlayerId);
    if (!player || !player.isConnected) {
      await this.startNextTurn(context);
      return;
    }

    // Initialize turn
    this.turnState.turnStartTime = Date.now();
    this.turnState.timeRemaining = this.turnDuration;

    // Call game-specific turn start logic
    await this.onTurnStart(context, currentPlayerId);

    // Start turn timer
    this.startTurnTimer(context);
  }

  /**
   * End the current turn
   * Called when turn completes normally (not timeout)
   */
  protected endCurrentTurn(context: GameContext): void {
    this.clearTimers();
    this.onTurnEnd(context);

    // Schedule next turn after a delay
    context.scheduleTimeout(() => {
      this.startNextTurn(context);
    }, 3000); // 3 second delay between turns
  }

  /**
   * Skip the current turn (e.g., player disconnected)
   */
  protected skipCurrentTurn(context: GameContext): void {
    this.clearTimers();

    context.broadcast(`${this.id}:turn_skipped`, {
      playerId: this.getCurrentPlayerId(),
      reason: 'player_unavailable',
    });

    // Start next turn immediately
    this.startNextTurn(context);
  }

  /**
   * Start the turn timer
   */
  protected startTurnTimer(context: GameContext): void {
    this.clearTimers();

    // Tick every second
    this.tickIntervalCancel = context.scheduleInterval(() => {
      this.turnState.timeRemaining--;

      // Broadcast tick
      context.broadcast(`${this.id}:tick`, {
        timeRemaining: this.turnState.timeRemaining,
      });

      // Check for timeout
      if (this.turnState.timeRemaining <= 0) {
        this.handleTurnTimeout(context);
      }
    }, 1000);

    // Backup timeout (in case interval misses)
    this.turnTimerCancel = context.scheduleTimeout(() => {
      if (this.turnState.timeRemaining > 0) {
        this.handleTurnTimeout(context);
      }
    }, (this.turnDuration + 1) * 1000);
  }

  /**
   * Handle turn timeout
   */
  protected handleTurnTimeout(context: GameContext): void {
    this.clearTimers();
    this.onTurnTimeout(context);

    // Schedule next turn
    context.scheduleTimeout(() => {
      this.startNextTurn(context);
    }, 3000);
  }

  /**
   * Clear all active timers
   */
  protected clearTimers(): void {
    if (this.turnTimerCancel) {
      this.turnTimerCancel();
      this.turnTimerCancel = null;
    }
    if (this.tickIntervalCancel) {
      this.tickIntervalCancel();
      this.tickIntervalCancel = null;
    }
  }

  // =========================================================================
  // Accessors
  // =========================================================================

  /**
   * Get the current player's ID (whose turn it is)
   */
  protected getCurrentPlayerId(): number {
    return this.turnState.turnOrder[this.turnState.currentTurnIndex];
  }

  /**
   * Check if it's a specific player's turn
   */
  protected isPlayersTurn(playerId: number): boolean {
    return this.getCurrentPlayerId() === playerId;
  }

  /**
   * Get current round number
   */
  protected getCurrentRound(): number {
    return this.turnState.currentRound;
  }

  /**
   * Get remaining time in current turn
   */
  protected getTimeRemaining(): number {
    return this.turnState.timeRemaining;
  }

  /**
   * Get elapsed time in current turn
   */
  protected getElapsedTime(): number {
    return this.turnDuration - this.turnState.timeRemaining;
  }

  // =========================================================================
  // Game End
  // =========================================================================

  /**
   * Handle game end
   */
  onGameEnd(context: GameContext): GameResult {
    this.clearTimers();

    const scores = context.getScoreBoard();
    const winner = scores.length > 0 ? scores[0] : null;

    return {
      winnerId: winner?.playerId || null,
      finalScores: scores.map((s, index) => ({
        playerId: s.playerId,
        score: s.score,
        rank: index + 1,
      })),
      stats: {
        totalRounds: this.turnState.currentRound,
        totalTurns: this.turnState.currentRound * this.turnState.turnOrder.length,
      },
      duration: 0, // Will be calculated by room manager
    };
  }

  /**
   * Cleanup on game destroy
   */
  cleanup(): void {
    this.clearTimers();
  }

  /**
   * Handle player leaving during game
   */
  onPlayerLeave(context: GameContext, playerId: number): void {
    super.onPlayerLeave(context, playerId);

    // If it was the leaving player's turn, skip to next
    if (context.isGameActive && this.isPlayersTurn(playerId)) {
      this.skipCurrentTurn(context);
    }
  }
}
