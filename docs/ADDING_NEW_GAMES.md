# Adding New Games to the Mini-Games Platform

This document provides a comprehensive guide for adding new multiplayer games to the mini-games platform. Follow this guide to ensure consistency, maintainability, and proper integration with the existing infrastructure.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Database Setup](#database-setup)
6. [Testing](#testing)
7. [Checklist](#checklist)
8. [Example: Adding a Trivia Game](#example-adding-a-trivia-game)

---

## Architecture Overview

The games platform follows a **plugin architecture** where each game is a self-contained module that implements common interfaces. This allows adding new games without modifying core infrastructure.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Game Registry** | Central registry where games are registered and discovered |
| **Game Interface** | Contract that all games must implement |
| **Base Game Classes** | Abstract classes providing common functionality |
| **Game Context** | Runtime context providing access to players, room, and broadcasting |
| **Game Actions** | Type-safe actions that players can perform |
| **Game State** | Game-specific state managed by the game implementation |

### Directory Structure

```
backend/src/games/
├── core/                           # DO NOT MODIFY - Core framework
│   ├── interfaces/                 # Contracts
│   ├── abstracts/                  # Base classes
│   ├── services/                   # Core services
│   └── types/                      # Shared types
└── implementations/                # ADD YOUR GAME HERE
    ├── skribbl/                    # Example: Drawing game
    ├── trivia/                     # Example: Trivia game
    └── your-game/                  # Your new game

frontend/src/features/games/
├── core/                           # DO NOT MODIFY - Core framework
│   ├── components/                 # Shared UI components
│   ├── hooks/                      # Shared hooks
│   └── registry/                   # Game registry
└── implementations/                # ADD YOUR GAME HERE
    ├── skribbl/                    # Example: Drawing game
    ├── trivia/                     # Example: Trivia game
    └── your-game/                  # Your new game
```

---

## Prerequisites

Before adding a new game, ensure you understand:

1. **Game Type**: Is it turn-based, real-time, or phase-based?
2. **Player Interactions**: What actions can players perform?
3. **State Requirements**: What data needs to be tracked?
4. **Win Conditions**: How does the game end and who wins?
5. **UI Requirements**: What components are needed?

---

## Backend Implementation

### Step 1: Create Game Directory

Create a new directory for your game:

```
backend/src/games/implementations/your-game/
├── your-game.game.ts           # Main game class
├── your-game.actions.ts        # Action type definitions
├── your-game.state.ts          # State type definitions
├── your-game.config.ts         # Constants and configuration
└── services/                   # Game-specific services (optional)
    └── your-service.service.ts
```

### Step 2: Define Game Configuration

Create constants and default settings in `your-game.config.ts`:

```typescript
// backend/src/games/implementations/your-game/your-game.config.ts

export const YOUR_GAME_CONFIG = {
  // Game identity
  id: 'your-game',
  name: 'Your Game Name',
  description: 'A brief description of your game',

  // Player limits
  minPlayers: 2,
  maxPlayers: 8,

  // Timing (in seconds)
  turnDuration: 30,
  roundDuration: 60,

  // Scoring
  pointsPerCorrectAnswer: 100,
  bonusPoints: 50,

  // Default settings (user-configurable)
  defaultSettings: {
    rounds: 3,
    difficulty: 'medium',
    timeLimit: 30,
    // Add game-specific settings
  },
} as const;

// Type for settings
export type YourGameSettings = typeof YOUR_GAME_CONFIG.defaultSettings;
```

### Step 3: Define State Types

Define your game's state structure in `your-game.state.ts`:

```typescript
// backend/src/games/implementations/your-game/your-game.state.ts

export type YourGamePhase =
  | 'waiting'      // Waiting for game to start
  | 'round_start'  // Beginning of a round
  | 'playing'      // Active gameplay
  | 'round_end'    // End of a round
  | 'game_over';   // Game finished

export interface YourGameState {
  phase: YourGamePhase;
  currentRound: number;
  totalRounds: number;
  scores: Map<number, number>;  // playerId -> score

  // Add game-specific state
  currentQuestion?: Question;
  playerAnswers: Map<number, string>;
  timeRemaining: number;
}

// Initial state factory
export const createInitialState = (): YourGameState => ({
  phase: 'waiting',
  currentRound: 0,
  totalRounds: 3,
  scores: new Map(),
  playerAnswers: new Map(),
  timeRemaining: 0,
});
```

### Step 4: Define Actions

Define all possible player actions in `your-game.actions.ts`:

```typescript
// backend/src/games/implementations/your-game/your-game.actions.ts

import type { BaseGameAction } from '../../core/interfaces/game-action.interface';

// Action type constants
export const YOUR_GAME_ACTIONS = {
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  USE_HINT: 'USE_HINT',
  SKIP_QUESTION: 'SKIP_QUESTION',
} as const;

// Action interfaces
export interface SubmitAnswerAction extends BaseGameAction {
  type: typeof YOUR_GAME_ACTIONS.SUBMIT_ANSWER;
  payload: {
    answer: string;
  };
}

export interface UseHintAction extends BaseGameAction {
  type: typeof YOUR_GAME_ACTIONS.USE_HINT;
  payload: {};
}

export interface SkipQuestionAction extends BaseGameAction {
  type: typeof YOUR_GAME_ACTIONS.SKIP_QUESTION;
  payload: {};
}

// Union type of all actions
export type YourGameAction =
  | SubmitAnswerAction
  | UseHintAction
  | SkipQuestionAction;

// Type guard helpers
export const isSubmitAnswerAction = (action: YourGameAction): action is SubmitAnswerAction =>
  action.type === YOUR_GAME_ACTIONS.SUBMIT_ANSWER;
```

### Step 5: Implement the Game Class

Choose the appropriate base class and implement your game:

#### Option A: Extend `BaseGame` (for custom game loops)

```typescript
// backend/src/games/implementations/your-game/your-game.game.ts

import { BaseGame } from '../../core/abstracts/base-game.abstract';
import type { GameContext, ActionResult } from '../../core/interfaces';
import { YOUR_GAME_CONFIG } from './your-game.config';
import { createInitialState, type YourGameState, type YourGamePhase } from './your-game.state';
import type { YourGameAction } from './your-game.actions';
import { YOUR_GAME_ACTIONS, isSubmitAnswerAction } from './your-game.actions';

export class YourGame extends BaseGame {
  // Required properties from interface
  readonly id = YOUR_GAME_CONFIG.id;
  readonly name = YOUR_GAME_CONFIG.name;
  readonly description = YOUR_GAME_CONFIG.description;
  readonly minPlayers = YOUR_GAME_CONFIG.minPlayers;
  readonly maxPlayers = YOUR_GAME_CONFIG.maxPlayers;
  readonly defaultSettings = YOUR_GAME_CONFIG.defaultSettings;

  // Game state
  private state: YourGameState;

  constructor() {
    super();
    this.state = createInitialState();
  }

  // Required: Return initial state
  getInitialState(): YourGameState {
    return createInitialState();
  }

  // Required: Handle game start
  onGameStart(context: GameContext): void {
    this.state = createInitialState();
    this.state.totalRounds = context.settings.rounds;

    // Initialize scores for all players
    for (const [playerId] of context.players) {
      this.state.scores.set(playerId, 0);
    }

    // Start the first round
    this.startRound(context);
  }

  // Required: Handle game end
  onGameEnd(context: GameContext): GameResult {
    const scores = Array.from(this.state.scores.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);

    return {
      winnerId: scores[0]?.playerId,
      finalScores: scores,
      stats: {
        totalRounds: this.state.currentRound,
        // Add game-specific stats
      },
    };
  }

  // Required: Handle player actions
  handleAction(context: GameContext, action: YourGameAction): ActionResult {
    // Validate action is allowed in current phase
    if (!this.isActionAllowed(action)) {
      return { success: false, error: 'Action not allowed in current phase' };
    }

    switch (action.type) {
      case YOUR_GAME_ACTIONS.SUBMIT_ANSWER:
        return this.handleSubmitAnswer(context, action);

      case YOUR_GAME_ACTIONS.USE_HINT:
        return this.handleUseHint(context, action);

      case YOUR_GAME_ACTIONS.SKIP_QUESTION:
        return this.handleSkipQuestion(context, action);

      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  // Required: Get public state (what players can see)
  getPublicState(context: GameContext, playerId: number): PublicGameState {
    return {
      phase: this.state.phase,
      currentRound: this.state.currentRound,
      totalRounds: this.state.totalRounds,
      scores: Object.fromEntries(this.state.scores),
      timeRemaining: this.state.timeRemaining,
      // Include game-specific public state
      // IMPORTANT: Don't expose sensitive data (e.g., correct answers)
    };
  }

  // =========================================================================
  // Private game logic methods
  // =========================================================================

  private startRound(context: GameContext): void {
    this.state.currentRound++;
    this.state.phase = 'round_start';
    this.state.playerAnswers.clear();

    context.broadcast('your-game:round_start', {
      round: this.state.currentRound,
      totalRounds: this.state.totalRounds,
    });

    // Transition to playing phase after short delay
    setTimeout(() => this.startPlaying(context), 2000);
  }

  private startPlaying(context: GameContext): void {
    this.state.phase = 'playing';
    this.state.timeRemaining = YOUR_GAME_CONFIG.turnDuration;

    // Load game content (questions, prompts, etc.)
    // this.state.currentQuestion = await this.questionService.getQuestion();

    context.broadcast('your-game:playing', {
      // Send game content to players
      timeLimit: this.state.timeRemaining,
    });

    // Start timer
    this.startTimer(context);
  }

  private handleSubmitAnswer(context: GameContext, action: SubmitAnswerAction): ActionResult {
    const { playerId, payload } = action;

    // Check if player already answered
    if (this.state.playerAnswers.has(playerId)) {
      return { success: false, error: 'Already answered' };
    }

    // Record answer
    this.state.playerAnswers.set(playerId, payload.answer);

    // Check if answer is correct and award points
    const isCorrect = this.checkAnswer(payload.answer);
    if (isCorrect) {
      const points = this.calculatePoints();
      this.addScore(playerId, points);

      context.broadcast('your-game:correct_answer', { playerId, points });
    }

    // Check if all players answered
    if (this.state.playerAnswers.size >= context.players.size) {
      this.endRound(context);
    }

    return { success: true, correct: isCorrect };
  }

  private isActionAllowed(action: YourGameAction): boolean {
    const allowedActions: Record<YourGamePhase, string[]> = {
      waiting: [],
      round_start: [],
      playing: [YOUR_GAME_ACTIONS.SUBMIT_ANSWER, YOUR_GAME_ACTIONS.USE_HINT],
      round_end: [],
      game_over: [],
    };

    return allowedActions[this.state.phase]?.includes(action.type) ?? false;
  }

  private addScore(playerId: number, points: number): void {
    const current = this.state.scores.get(playerId) || 0;
    this.state.scores.set(playerId, current + points);
  }

  // ... additional private methods
}
```

#### Option B: Extend `TurnBasedGame` (for turn-based games)

```typescript
// For games where players take turns (like Skribbl)

import { TurnBasedGame } from '../../core/abstracts/turn-based-game.abstract';

export class YourTurnBasedGame extends TurnBasedGame {
  // TurnBasedGame provides:
  // - Turn order management
  // - Round management
  // - Timer management
  // - Common turn lifecycle

  protected turnDuration = 30;  // Override with your duration
  protected totalRounds = 3;    // Override with your rounds

  // Implement these abstract methods:
  protected onTurnStart(context: GameContext, playerId: number): void {
    // Called when a player's turn begins
  }

  protected onTurnEnd(context: GameContext): void {
    // Called when a turn ends normally
  }

  protected onTurnTimeout(context: GameContext): void {
    // Called when turn timer expires
  }

  // Plus all BaseGame methods...
}
```

### Step 6: Register the Game

Add your game to the registry in `implementations/index.ts`:

```typescript
// backend/src/games/implementations/index.ts

import { gameRegistry } from '../core/services/game-registry.service';
import { SkribblGame } from './skribbl/skribbl.game';
import { YourGame } from './your-game/your-game.game';  // Add import

export function registerAllGames(): void {
  gameRegistry.register(new SkribblGame());
  gameRegistry.register(new YourGame());  // Add registration
}
```

### Step 7: Add Game-Specific Services (Optional)

If your game needs external data (questions, words, etc.), create a service:

```typescript
// backend/src/games/implementations/your-game/services/question.service.ts

import { query } from '../../../../db/connection';

export class QuestionService {
  async getRandomQuestion(difficulty: string): Promise<Question> {
    const result = await query(
      `SELECT * FROM your_game_questions
       WHERE difficulty = $1
       ORDER BY RANDOM()
       LIMIT 1`,
      [difficulty]
    );
    return result.rows[0];
  }

  async getQuestionsByCategory(category: string, count: number): Promise<Question[]> {
    // Implementation
  }
}
```

---

## Frontend Implementation

### Step 1: Create Game Directory

```
frontend/src/features/games/implementations/your-game/
├── YourGame.tsx                # Main game component
├── components/                 # Game-specific components
│   ├── QuestionCard.tsx
│   ├── AnswerInput.tsx
│   └── ScoreDisplay.tsx
├── hooks/                      # Game-specific hooks
│   └── useYourGame.ts
├── store/                      # Game-specific Redux slice (optional)
│   └── yourGameSlice.ts
└── types/
    └── your-game.types.ts
```

### Step 2: Define Frontend Types

```typescript
// frontend/src/features/games/implementations/your-game/types/your-game.types.ts

export interface YourGameState {
  phase: 'waiting' | 'round_start' | 'playing' | 'round_end' | 'game_over';
  currentRound: number;
  totalRounds: number;
  scores: Record<number, number>;
  timeRemaining: number;

  // Game-specific state
  currentQuestion?: {
    id: string;
    text: string;
    options?: string[];
  };
  hasAnswered: boolean;
  lastAnswerCorrect?: boolean;
}

export interface YourGameAction {
  type: 'SUBMIT_ANSWER' | 'USE_HINT' | 'SKIP_QUESTION';
  payload: Record<string, unknown>;
}
```

### Step 3: Create Game-Specific Hook

```typescript
// frontend/src/features/games/implementations/your-game/hooks/useYourGame.ts

import { useCallback } from 'react';
import { useGameState } from '../../../core/hooks/useGameState';
import type { YourGameState, YourGameAction } from '../types/your-game.types';

export function useYourGame() {
  const {
    gameState,
    players,
    currentUserId,
    sendAction,
    isConnected,
  } = useGameState<YourGameState, YourGameAction>();

  const submitAnswer = useCallback((answer: string) => {
    sendAction({
      type: 'SUBMIT_ANSWER',
      payload: { answer },
    });
  }, [sendAction]);

  const useHint = useCallback(() => {
    sendAction({
      type: 'USE_HINT',
      payload: {},
    });
  }, [sendAction]);

  const skipQuestion = useCallback(() => {
    sendAction({
      type: 'SKIP_QUESTION',
      payload: {},
    });
  }, [sendAction]);

  return {
    // State
    gameState,
    players,
    currentUserId,
    isConnected,

    // Computed
    isMyTurn: gameState.currentPlayerId === currentUserId,
    myScore: gameState.scores[currentUserId] || 0,

    // Actions
    submitAnswer,
    useHint,
    skipQuestion,
  };
}
```

### Step 4: Create Game Components

```typescript
// frontend/src/features/games/implementations/your-game/components/QuestionCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuestionCardProps {
  question: {
    text: string;
    options?: string[];
  };
  onAnswer: (answer: string) => void;
  disabled: boolean;
  timeRemaining: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  disabled,
  timeRemaining,
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{question.text}</CardTitle>
        <div className="text-center text-muted-foreground">
          Time: {timeRemaining}s
        </div>
      </CardHeader>
      <CardContent>
        {question.options ? (
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 text-lg"
                onClick={() => onAnswer(option)}
                disabled={disabled}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            placeholder="Type your answer..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onAnswer(e.currentTarget.value);
              }
            }}
            disabled={disabled}
          />
        )}
      </CardContent>
    </Card>
  );
};
```

### Step 5: Create Main Game Component

```typescript
// frontend/src/features/games/implementations/your-game/YourGame.tsx

import React from 'react';
import { useYourGame } from './hooks/useYourGame';
import { QuestionCard } from './components/QuestionCard';
import { ScoreBoard } from '../../core/components/GameLayout/ScoreBoard';
import { GameTimer } from '../../core/components/GameLayout/GameTimer';

export const YourGame: React.FC = () => {
  const {
    gameState,
    players,
    currentUserId,
    submitAnswer,
    useHint,
  } = useYourGame();

  // Render based on game phase
  const renderPhaseContent = () => {
    switch (gameState.phase) {
      case 'waiting':
        return (
          <div className="text-center">
            <p>Waiting for game to start...</p>
          </div>
        );

      case 'round_start':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Round {gameState.currentRound} of {gameState.totalRounds}
            </h2>
            <p className="text-muted-foreground">Get ready!</p>
          </div>
        );

      case 'playing':
        return (
          <div className="space-y-6">
            <GameTimer timeRemaining={gameState.timeRemaining} />

            {gameState.currentQuestion && (
              <QuestionCard
                question={gameState.currentQuestion}
                onAnswer={submitAnswer}
                disabled={gameState.hasAnswered}
                timeRemaining={gameState.timeRemaining}
              />
            )}

            {gameState.hasAnswered && (
              <div className="text-center">
                <p>
                  {gameState.lastAnswerCorrect
                    ? '✓ Correct!'
                    : '✗ Wrong answer'}
                </p>
                <p className="text-muted-foreground">
                  Waiting for other players...
                </p>
              </div>
            )}
          </div>
        );

      case 'round_end':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Round Complete!</h2>
            <ScoreBoard players={players} scores={gameState.scores} />
          </div>
        );

      case 'game_over':
        return null; // Handled by core GameResults component

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar: Scoreboard */}
      <aside className="w-64 border-r p-4">
        <ScoreBoard
          players={players}
          scores={gameState.scores}
          currentPlayerId={currentUserId}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 flex items-center justify-center">
        {renderPhaseContent()}
      </main>
    </div>
  );
};

export default YourGame;
```

### Step 6: Create Lobby Settings Component (Optional)

```typescript
// frontend/src/features/games/implementations/your-game/components/YourGameLobbySettings.tsx

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface YourGameLobbySettingsProps {
  settings: YourGameSettings;
  onChange: (settings: YourGameSettings) => void;
  disabled: boolean;
}

export const YourGameLobbySettings: React.FC<YourGameLobbySettingsProps> = ({
  settings,
  onChange,
  disabled,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Number of Rounds</Label>
        <Slider
          min={1}
          max={10}
          value={[settings.rounds]}
          onValueChange={([value]) => onChange({ ...settings, rounds: value })}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground">{settings.rounds} rounds</span>
      </div>

      <div>
        <Label>Difficulty</Label>
        <Select
          value={settings.difficulty}
          onValueChange={(value) => onChange({ ...settings, difficulty: value })}
          disabled={disabled}
        >
          <SelectItem value="easy">Easy</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="hard">Hard</SelectItem>
        </Select>
      </div>

      <div>
        <Label>Time Limit</Label>
        <Slider
          min={10}
          max={60}
          step={5}
          value={[settings.timeLimit]}
          onValueChange={([value]) => onChange({ ...settings, timeLimit: value })}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground">{settings.timeLimit} seconds</span>
      </div>
    </div>
  );
};
```

### Step 7: Register the Game (Frontend)

```typescript
// frontend/src/features/games/implementations/index.ts

import { gameRegistry } from '../core/registry/game-registry';
import { Skribbl } from './skribbl/Skribbl';
import { YourGame } from './your-game/YourGame';  // Add import
import { YourGameLobbySettings } from './your-game/components/YourGameLobbySettings';
import { IconYourGame } from '@tabler/icons-react';  // Choose appropriate icon

export function registerAllGames(): void {
  // Existing games...

  // Register your game
  gameRegistry.register({
    id: 'your-game',
    name: 'Your Game Name',
    description: 'A brief description of your game',
    icon: IconYourGame,
    component: YourGame,
    lobbyComponent: YourGameLobbySettings,
    settingsSchema: {
      rounds: { type: 'number', min: 1, max: 10, default: 3 },
      difficulty: {
        type: 'select',
        options: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      timeLimit: { type: 'number', min: 10, max: 60, default: 30 },
    },
  });
}
```

---

## Database Setup

### Step 1: Create Migration

If your game needs custom tables, create a migration:

```sql
-- backend/src/db/migrations/XXX_add_your_game_tables.sql

-- Game-specific content table
CREATE TABLE IF NOT EXISTS your_game_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    wrong_answers JSONB NOT NULL,  -- Array of wrong answers
    category VARCHAR(50),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,  -- NULL = global
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_your_game_questions_difficulty
    ON your_game_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_your_game_questions_category
    ON your_game_questions(category);
CREATE INDEX IF NOT EXISTS idx_your_game_questions_team
    ON your_game_questions(team_id);
```

### Step 2: Register Game Type

Add entry to `game_types` table (in seed or migration):

```sql
INSERT INTO game_types (id, name, description, min_players, max_players)
VALUES (
    'your-game',
    'Your Game Name',
    'A brief description of your game',
    2,
    8
) ON CONFLICT (id) DO NOTHING;
```

### Step 3: Create Seed Data (Optional)

```sql
-- backend/src/db/seeds/XXX_your_game_content.sql

INSERT INTO your_game_questions (question_text, correct_answer, wrong_answers, category, difficulty)
VALUES
    ('What is 2 + 2?', '4', '["3", "5", "22"]', 'math', 'easy'),
    ('Capital of France?', 'Paris', '["London", "Berlin", "Madrid"]', 'geography', 'easy'),
    -- Add more content...
ON CONFLICT DO NOTHING;
```

---

## Testing

### Backend Testing

```typescript
// backend/src/games/implementations/your-game/__tests__/your-game.game.test.ts

import { YourGame } from '../your-game.game';
import { createMockContext } from '../../../core/__tests__/test-utils';

describe('YourGame', () => {
  let game: YourGame;
  let context: MockGameContext;

  beforeEach(() => {
    game = new YourGame();
    context = createMockContext({
      players: [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' },
      ],
    });
  });

  describe('getInitialState', () => {
    it('should return valid initial state', () => {
      const state = game.getInitialState();
      expect(state.phase).toBe('waiting');
      expect(state.currentRound).toBe(0);
      expect(state.scores.size).toBe(0);
    });
  });

  describe('handleAction', () => {
    it('should handle SUBMIT_ANSWER action', () => {
      game.onGameStart(context);
      // Manually set phase to 'playing' for test

      const result = game.handleAction(context, {
        type: 'SUBMIT_ANSWER',
        playerId: 1,
        payload: { answer: 'test answer' },
      });

      expect(result.success).toBe(true);
    });

    it('should reject actions in wrong phase', () => {
      // Game hasn't started, still in 'waiting' phase

      const result = game.handleAction(context, {
        type: 'SUBMIT_ANSWER',
        playerId: 1,
        payload: { answer: 'test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('scoring', () => {
    it('should award points for correct answers', () => {
      // Test scoring logic
    });
  });
});
```

### Frontend Testing

```typescript
// frontend/src/features/games/implementations/your-game/__tests__/YourGame.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { YourGame } from '../YourGame';
import { createMockStore } from '../../../core/__tests__/test-utils';

describe('YourGame', () => {
  it('should render waiting state', () => {
    const store = createMockStore({
      game: {
        gameState: { phase: 'waiting' },
      },
    });

    render(
      <Provider store={store}>
        <YourGame />
      </Provider>
    );

    expect(screen.getByText(/waiting/i)).toBeInTheDocument();
  });

  it('should handle answer submission', () => {
    // Test interaction
  });
});
```

---

## Checklist

Use this checklist when adding a new game:

### Backend Checklist

- [ ] Created game directory: `backend/src/games/implementations/your-game/`
- [ ] Created `your-game.config.ts` with constants and default settings
- [ ] Created `your-game.state.ts` with state types and initial state factory
- [ ] Created `your-game.actions.ts` with action types
- [ ] Created `your-game.game.ts` implementing `IGameDefinition`
- [ ] Chose correct base class (`BaseGame` or `TurnBasedGame`)
- [ ] Implemented all required methods:
  - [ ] `getInitialState()`
  - [ ] `onGameStart()`
  - [ ] `onGameEnd()`
  - [ ] `handleAction()`
  - [ ] `getPublicState()`
- [ ] Created game-specific services (if needed)
- [ ] Registered game in `implementations/index.ts`
- [ ] Created database migration (if needed)
- [ ] Added seed data (if needed)
- [ ] Written unit tests

### Frontend Checklist

- [ ] Created game directory: `frontend/src/features/games/implementations/your-game/`
- [ ] Created type definitions in `types/your-game.types.ts`
- [ ] Created custom hook in `hooks/useYourGame.ts`
- [ ] Created game-specific components in `components/`
- [ ] Created main game component `YourGame.tsx`
- [ ] Created lobby settings component (optional)
- [ ] Created Redux slice (if needed for complex state)
- [ ] Registered game in `implementations/index.ts`
- [ ] Written component tests

### Integration Checklist

- [ ] Game appears in games list
- [ ] Can create room with game
- [ ] Can join room via code
- [ ] Game starts correctly with minimum players
- [ ] All game phases work correctly
- [ ] Scoring works correctly
- [ ] Game ends and shows results
- [ ] Leaderboard updates correctly

---

## Example: Adding a Trivia Game

Here's a condensed example of adding a trivia game:

### Backend

```typescript
// backend/src/games/implementations/trivia/trivia.config.ts
export const TRIVIA_CONFIG = {
  id: 'trivia',
  name: 'Team Trivia',
  description: 'Answer questions and compete for points',
  minPlayers: 2,
  maxPlayers: 10,
  questionTime: 20,
  defaultSettings: {
    rounds: 10,
    category: 'all',
    difficulty: 'medium',
  },
} as const;

// backend/src/games/implementations/trivia/trivia.game.ts
export class TriviaGame extends BaseGame {
  readonly id = TRIVIA_CONFIG.id;
  readonly name = TRIVIA_CONFIG.name;
  // ... implement all required methods
}
```

### Frontend

```typescript
// frontend/src/features/games/implementations/trivia/Trivia.tsx
export const Trivia: React.FC = () => {
  const { gameState, submitAnswer } = useTrivia();

  return (
    <div>
      {gameState.currentQuestion && (
        <QuestionCard
          question={gameState.currentQuestion}
          onAnswer={submitAnswer}
        />
      )}
    </div>
  );
};

// Register in implementations/index.ts
gameRegistry.register({
  id: 'trivia',
  name: 'Team Trivia',
  component: Trivia,
  // ...
});
```

---

## Best Practices

1. **Follow Existing Patterns**: Look at Skribbl implementation for reference
2. **Keep State Minimal**: Only store what's necessary
3. **Validate Actions**: Always validate actions on the backend
4. **Sanitize Public State**: Never expose sensitive data (answers, etc.)
5. **Handle Edge Cases**: Player disconnection, timeouts, insufficient players
6. **Use Type Safety**: Leverage TypeScript for action and state types
7. **Test Thoroughly**: Cover all game phases and edge cases
8. **Document Configuration**: Comment non-obvious settings and constants

---

## Getting Help

- Review existing implementations in `implementations/skribbl/`
- Check core interfaces in `core/interfaces/`
- See base classes in `core/abstracts/`
- Refer to type definitions in `core/types/`

For questions about the architecture, consult this document or review the codebase documentation.
