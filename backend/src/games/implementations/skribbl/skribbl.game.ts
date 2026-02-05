/**
 * Skribbl Game Implementation
 *
 * Drawing and guessing game where players take turns drawing words.
 */

import { TurnBasedGame } from '../../core/abstracts/turn-based-game.abstract';
import type { GameContext } from '../../core/interfaces/game-context.interface';
import type { ActionResult, GameResult } from '../../core/types/common.types';
import { SKRIBBL_CONFIG, calculateGuesserPoints, type SkribblSettings } from './skribbl.config';
import {
  type SkribblState,
  type SkribblPublicState,
  type DrawStroke,
  type GameChatMessage,
  type TurnResult,
  createInitialSkribblState,
} from './skribbl.types';
import {
  type SkribblAction,
  SKRIBBL_ACTIONS,
  isPickWordAction,
  isSubmitGuessAction,
  isDrawStrokeAction,
  isClearCanvasAction,
  isUndoStrokeAction,
} from './skribbl.actions';
import { WordService } from './services/word.service';
import { nanoid } from 'nanoid';

/**
 * Skribbl Game Class
 */
export class SkribblGame extends TurnBasedGame<SkribblState, SkribblAction, SkribblSettings> {
  // =========================================================================
  // Game Identity
  // =========================================================================

  readonly id = SKRIBBL_CONFIG.id;
  readonly name = SKRIBBL_CONFIG.name;
  readonly description = SKRIBBL_CONFIG.description;
  readonly minPlayers = SKRIBBL_CONFIG.minPlayers;
  readonly maxPlayers = SKRIBBL_CONFIG.maxPlayers;
  readonly defaultSettings = SKRIBBL_CONFIG.defaultSettings;

  // =========================================================================
  // Turn-Based Configuration
  // =========================================================================

  protected turnDuration: number = SKRIBBL_CONFIG.drawTime;
  protected totalRounds: number = SKRIBBL_CONFIG.defaultSettings.rounds;

  // =========================================================================
  // Game Services
  // =========================================================================

  private wordService: WordService;

  // =========================================================================
  // Game State
  // =========================================================================

  private state: SkribblState = createInitialSkribblState();
  private wordPickTimer: (() => void) | null = null;
  private hintTimer: (() => void) | null = null;

  constructor() {
    super();
    this.wordService = new WordService();
  }

  // =========================================================================
  // State Management
  // =========================================================================

  getInitialState(): SkribblState {
    return createInitialSkribblState();
  }

  getPublicState(context: GameContext, playerId: number): SkribblPublicState {
    const isDrawer = playerId === this.state.drawerId;

    const publicState: SkribblPublicState = {
      phase: this.state.phase,
      currentRound: this.state.currentRound,
      totalRounds: this.state.totalRounds,
      drawerId: this.state.drawerId,
      timeRemaining: this.state.timeRemaining,
      hint: this.generateHint(this.state.currentWord, this.state.hintsRevealed),
      strokes: this.state.strokes,
      guessedPlayers: Array.from(this.state.guessedPlayers),
      messages: this.state.messages.slice(-50), // Last 50 messages
      lastTurnResult: this.state.lastTurnResult,
    };

    // Add drawer-specific data
    if (isDrawer) {
      publicState.currentWord = this.state.currentWord || undefined;
      if (this.state.phase === 'picking_word') {
        publicState.wordOptions = this.state.wordOptions;
      }
    }

    return publicState;
  }

  // =========================================================================
  // Game Lifecycle
  // =========================================================================

  async onGameStart(context: GameContext): Promise<void> {
    // Reset state
    this.state = createInitialSkribblState();
    this.wordService.resetUsedWords();

    // Apply settings
    const settings = context.settings as SkribblSettings;
    this.state.totalRounds = settings.rounds || SKRIBBL_CONFIG.defaultSettings.rounds;
    this.turnDuration = settings.drawTime || SKRIBBL_CONFIG.drawTime;
    this.totalRounds = this.state.totalRounds;

    // Call parent implementation (sets up turn order, etc.)
    await super.onGameStart(context);
  }

  onGameEnd(context: GameContext): GameResult {
    this.clearGameTimers();
    return super.onGameEnd(context);
  }

  // =========================================================================
  // Turn Lifecycle (from TurnBasedGame)
  // =========================================================================

  protected async onTurnStart(context: GameContext, playerId: number): Promise<void> {
    // Reset turn state
    this.state.drawerId = playerId;
    this.state.strokes = [];
    this.state.guessedPlayers.clear();
    this.state.hintsRevealed = 0;
    this.state.currentWord = null;
    this.state.lastTurnResult = null;
    this.state.phase = 'picking_word';

    // Get word options
    const settings = context.settings as SkribblSettings;
    this.state.wordOptions = await this.wordService.getWordOptions(
      SKRIBBL_CONFIG.wordOptionsCount,
      settings.wordDifficulty
    );

    // Send word options to drawer
    context.sendToPlayer(playerId, `${this.id}:pick_word`, {
      options: this.state.wordOptions,
      timeLimit: SKRIBBL_CONFIG.wordPickTime,
    });

    // Notify others
    context.broadcastExcept(`${this.id}:waiting_for_drawer`, { drawerId: playerId }, playerId);

    // Auto-pick if drawer doesn't choose in time
    this.wordPickTimer = context.scheduleTimeout(() => {
      if (this.state.phase === 'picking_word') {
        this.autoPickWord(context);
      }
    }, SKRIBBL_CONFIG.wordPickTime * 1000);
  }

  protected onTurnEnd(context: GameContext): void {
    this.clearGameTimers();

    // Calculate turn results
    const turnResult: TurnResult = {
      word: this.state.currentWord || '',
      drawerId: this.state.drawerId || 0,
      guessedPlayers: Array.from(this.state.guessedPlayers),
      scores: context.getScoreBoard().map((s) => ({ playerId: s.playerId, points: s.score })),
    };

    this.state.lastTurnResult = turnResult;
    this.state.phase = 'turn_results';

    // Broadcast turn end
    context.broadcast(`${this.id}:turn_end`, turnResult);
  }

  protected onTurnTimeout(context: GameContext): void {
    // Same as turn end but with timeout message
    this.addSystemMessage("Time's up!");
    this.onTurnEnd(context);
  }

  // =========================================================================
  // Action Handling
  // =========================================================================

  async handleAction(context: GameContext, action: SkribblAction): Promise<ActionResult> {
    // Validate phase
    if (!this.isActionAllowed(action)) {
      return { success: false, error: 'Action not allowed in current phase' };
    }

    if (isPickWordAction(action)) {
      return this.handlePickWord(context, action);
    }

    if (isSubmitGuessAction(action)) {
      return this.handleSubmitGuess(context, action);
    }

    if (isDrawStrokeAction(action)) {
      return this.handleDrawStroke(context, action);
    }

    if (isClearCanvasAction(action)) {
      return this.handleClearCanvas(context, action);
    }

    if (isUndoStrokeAction(action)) {
      return this.handleUndoStroke(context, action);
    }

    return { success: false, error: 'Unknown action type' };
  }

  /**
   * Check if action is allowed in current phase
   */
  private isActionAllowed(action: SkribblAction): boolean {
    const allowedActions: Record<string, string[]> = {
      lobby: [],
      starting: [],
      round_start: [],
      picking_word: [SKRIBBL_ACTIONS.PICK_WORD],
      drawing: [
        SKRIBBL_ACTIONS.SUBMIT_GUESS,
        SKRIBBL_ACTIONS.DRAW_STROKE,
        SKRIBBL_ACTIONS.CLEAR_CANVAS,
        SKRIBBL_ACTIONS.UNDO_STROKE,
      ],
      turn_results: [],
      game_over: [],
    };

    return allowedActions[this.state.phase]?.includes(action.type) ?? false;
  }

  /**
   * Handle word pick action
   */
  private handlePickWord(context: GameContext, action: SkribblAction): ActionResult {
    const { playerId, payload } = action;

    // Only drawer can pick
    if (playerId !== this.state.drawerId) {
      return { success: false, error: 'Only the drawer can pick a word' };
    }

    // Validate word index
    const wordIndex = (payload as { wordIndex: number }).wordIndex;
    if (wordIndex < 0 || wordIndex >= this.state.wordOptions.length) {
      return { success: false, error: 'Invalid word selection' };
    }

    // Clear word pick timer
    if (this.wordPickTimer) {
      this.wordPickTimer();
      this.wordPickTimer = null;
    }

    // Set word and start drawing phase
    this.state.currentWord = this.state.wordOptions[wordIndex];
    this.state.wordOptions = [];
    this.state.phase = 'drawing';
    this.state.turnStartTime = Date.now();
    this.state.timeRemaining = this.turnDuration;

    // Send word to drawer
    context.sendToPlayer(playerId, `${this.id}:your_word`, {
      word: this.state.currentWord,
    });

    // Send hint to guessers
    const hint = this.generateHint(this.state.currentWord, 0);
    context.broadcast(`${this.id}:turn_start`, {
      drawerId: this.state.drawerId,
      hint,
      timeSeconds: this.turnDuration,
    });

    // Schedule hint reveals
    this.scheduleHintReveals(context);

    // Start the turn timer (from parent class)
    this.startTurnTimer(context);

    return { success: true };
  }

  /**
   * Handle guess submission
   */
  private handleSubmitGuess(context: GameContext, action: SkribblAction): ActionResult {
    const { playerId, payload } = action;
    const guess = ((payload as { guess: string }).guess || '').trim();

    // Drawer can't guess
    if (playerId === this.state.drawerId) {
      return { success: false, error: 'Drawer cannot guess' };
    }

    // Already guessed correctly
    if (this.state.guessedPlayers.has(playerId)) {
      return { success: false, error: 'Already guessed correctly' };
    }

    // Empty guess
    if (!guess) {
      return { success: false, error: 'Guess cannot be empty' };
    }

    const player = context.getPlayer(playerId);
    const playerName = player?.name || 'Unknown';

    // Check if correct
    const normalizedGuess = guess.toLowerCase();
    const normalizedWord = (this.state.currentWord || '').toLowerCase();

    if (normalizedGuess === normalizedWord) {
      return this.handleCorrectGuess(context, playerId, playerName);
    }

    // Check if close guess (contains word or word contains guess)
    const isClose = this.isCloseGuess(normalizedGuess, normalizedWord);

    if (isClose) {
      // Don't show close guesses to avoid giving hints
      this.addChatMessage(playerId, playerName, guess, 'close');
      context.sendToPlayer(playerId, `${this.id}:close_guess`, {});
      return { success: true, data: { correct: false, close: true } };
    }

    // Wrong guess - broadcast to all
    this.addChatMessage(playerId, playerName, guess, 'guess');
    context.broadcast(`${this.id}:guess`, {
      playerId,
      playerName,
      guess,
    });

    return { success: true, data: { correct: false } };
  }

  /**
   * Handle correct guess
   */
  private handleCorrectGuess(context: GameContext, playerId: number, playerName: string): ActionResult {
    // Calculate points based on time
    const elapsedSeconds = this.turnDuration - this.state.timeRemaining;
    const guesserPoints = calculateGuesserPoints(elapsedSeconds, this.turnDuration);

    // Award points
    context.addScore(playerId, guesserPoints);
    context.addScore(this.state.drawerId!, SKRIBBL_CONFIG.scoring.drawerPointsPerGuess);

    // Mark as guessed
    this.state.guessedPlayers.add(playerId);

    // Add message
    this.addChatMessage(playerId, playerName, 'guessed the word!', 'correct');

    // Broadcast correct guess
    context.broadcast(`${this.id}:correct_guess`, {
      playerId,
      playerName,
      points: guesserPoints,
    });

    // Check if everyone guessed
    const totalGuessers = context.getConnectedPlayerCount() - 1; // Exclude drawer
    if (this.state.guessedPlayers.size >= totalGuessers) {
      // Bonus for drawer
      context.addScore(this.state.drawerId!, SKRIBBL_CONFIG.scoring.drawerBonusAllGuessed);
      this.addSystemMessage('Everyone guessed correctly! Bonus points for the drawer!');

      // End turn early
      this.endCurrentTurn(context);
    }

    return { success: true, data: { correct: true, points: guesserPoints } };
  }

  /**
   * Handle draw stroke
   */
  private handleDrawStroke(context: GameContext, action: SkribblAction): ActionResult {
    const { playerId, payload } = action;

    // Only drawer can draw
    if (playerId !== this.state.drawerId) {
      return { success: false, error: 'Only drawer can draw' };
    }

    const stroke = (payload as { stroke: DrawStroke }).stroke;
    this.state.strokes.push(stroke);

    // Broadcast to all except drawer
    context.broadcastExcept(`${this.id}:stroke`, { stroke }, playerId);

    return { success: true };
  }

  /**
   * Handle clear canvas
   */
  private handleClearCanvas(context: GameContext, action: SkribblAction): ActionResult {
    const { playerId } = action;

    if (playerId !== this.state.drawerId) {
      return { success: false, error: 'Only drawer can clear canvas' };
    }

    this.state.strokes = [];
    context.broadcast(`${this.id}:clear_canvas`, {});

    return { success: true };
  }

  /**
   * Handle undo stroke
   */
  private handleUndoStroke(context: GameContext, action: SkribblAction): ActionResult {
    const { playerId } = action;

    if (playerId !== this.state.drawerId) {
      return { success: false, error: 'Only drawer can undo' };
    }

    if (this.state.strokes.length > 0) {
      this.state.strokes.pop();
      context.broadcast(`${this.id}:undo_stroke`, {});
    }

    return { success: true };
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Auto pick a word if drawer doesn't choose
   */
  private autoPickWord(context: GameContext): void {
    if (this.state.wordOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.state.wordOptions.length);
      this.handlePickWord(context, {
        type: SKRIBBL_ACTIONS.PICK_WORD,
        playerId: this.state.drawerId!,
        payload: { wordIndex: randomIndex },
      });
    }
  }

  /**
   * Generate word hint with revealed letters
   */
  private generateHint(word: string | null, revealCount: number): string | null {
    if (!word) return null;

    const chars = word.split('');
    const letterIndices: number[] = [];

    // Find all letter positions
    chars.forEach((char, i) => {
      if (char !== ' ') letterIndices.push(i);
    });

    // Determine how many letters to reveal
    const lettersToReveal = Math.min(revealCount, Math.floor(letterIndices.length / 3));

    // Randomly select indices to reveal (deterministic based on word)
    const revealedIndices = new Set<number>();
    const shuffled = this.shuffle([...letterIndices]);
    for (let i = 0; i < lettersToReveal; i++) {
      revealedIndices.add(shuffled[i]);
    }

    // Build hint string
    return chars
      .map((char, i) => {
        if (char === ' ') return '  ';
        if (revealedIndices.has(i)) return char;
        return '_';
      })
      .join(' ');
  }

  /**
   * Schedule progressive hint reveals
   */
  private scheduleHintReveals(context: GameContext): void {
    const settings = context.settings as SkribblSettings;
    if (!settings.hintsEnabled) return;

    for (const revealTime of SKRIBBL_CONFIG.hintRevealTimes) {
      const delay = (this.turnDuration - revealTime) * 1000;
      if (delay > 0) {
        context.scheduleTimeout(() => {
          if (this.state.phase === 'drawing') {
            this.state.hintsRevealed++;
            const hint = this.generateHint(this.state.currentWord, this.state.hintsRevealed);
            context.broadcast(`${this.id}:hint_reveal`, { hint });
          }
        }, delay);
      }
    }
  }

  /**
   * Check if guess is close to the answer
   */
  private isCloseGuess(guess: string, word: string): boolean {
    if (guess.length < 2) return false;
    return word.includes(guess) || guess.includes(word);
  }

  /**
   * Add a chat message
   */
  private addChatMessage(
    playerId: number,
    playerName: string,
    content: string,
    type: GameChatMessage['type']
  ): void {
    this.state.messages.push({
      id: nanoid(8),
      playerId,
      playerName,
      content,
      type,
      timestamp: Date.now(),
    });
  }

  /**
   * Add a system message
   */
  private addSystemMessage(content: string): void {
    this.state.messages.push({
      id: nanoid(8),
      playerId: 0,
      playerName: 'System',
      content,
      type: 'system',
      timestamp: Date.now(),
    });
  }

  /**
   * Clear game-specific timers
   */
  private clearGameTimers(): void {
    if (this.wordPickTimer) {
      this.wordPickTimer();
      this.wordPickTimer = null;
    }
    if (this.hintTimer) {
      this.hintTimer();
      this.hintTimer = null;
    }
  }

  /**
   * Cleanup on game destroy
   */
  cleanup(): void {
    this.clearGameTimers();
    super.cleanup();
  }
}
