/**
 * Skribbl Game Component
 *
 * Main game component that renders based on current phase.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GameLayout } from '../../../core/components/GameLayout';
import { ChatBox } from '../../../core/components/ChatBox';
import { RoundResults } from '../../../core/components/GameResults';
import { DrawingCanvas, DrawingToolbar } from './DrawingCanvas';
import { WordPicker, WordHintDisplay } from './WordPicker';
import { useSkribblGame } from '../hooks/useSkribblGame';
import type { GameComponentProps } from '../../../core/registry/game-registry';

interface SkribblGameProps extends GameComponentProps {
  className?: string;
}

export function SkribblGame({ onLeave, className }: SkribblGameProps) {
  const {
    gameState,
    players,
    currentUserId,
    isDrawer,
    currentDrawer,
    hasGuessed,
    messages,
    toolSettings,
    setToolSettings,
    chooseWord,
    sendDrawStroke,
    clearCanvas,
    undoStroke,
    submitGuess,
  } = useSkribblGame();

  // Canvas dimensions (responsive)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 320, 800);
      const maxHeight = Math.min(window.innerHeight - 200, 600);
      setCanvasSize({
        width: Math.max(maxWidth, 400),
        height: Math.max(maxHeight, 300),
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle guess submission
  const handleGuess = useCallback(
    (message: string) => {
      if (!hasGuessed && !isDrawer) {
        submitGuess(message);
      }
    },
    [hasGuessed, isDrawer, submitGuess]
  );

  // Get status text based on phase
  const statusText = useMemo(() => {
    switch (gameState.phase) {
      case 'starting':
        return 'Game starting...';
      case 'round_start':
        return `Round ${gameState.round.roundNumber} starting...`;
      case 'picking_word':
        return isDrawer
          ? 'Choose a word to draw!'
          : `${currentDrawer?.name || 'Player'} is choosing a word...`;
      case 'drawing':
        return isDrawer
          ? 'Draw! Others are guessing...'
          : hasGuessed
          ? 'You guessed it! Wait for others...'
          : 'Guess the word!';
      case 'turn_results':
        return 'Turn complete!';
      case 'game_over':
        return 'Game over!';
      default:
        return '';
    }
  }, [gameState.phase, gameState.round, isDrawer, currentDrawer, hasGuessed]);

  // Render word picker for drawer
  if (gameState.phase === 'picking_word' && isDrawer && gameState.wordChoices) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <WordPicker
          choices={gameState.wordChoices}
          timeRemaining={gameState.countdown ?? 15}
          onSelectWord={chooseWord}
        />
      </div>
    );
  }

  // Render turn results
  if (gameState.phase === 'turn_results' && gameState.turnResults) {
    const scorers = gameState.turnResults
      .filter((r) => r.guessed)
      .map((r) => ({
        player: players.find((p) => p.id === r.playerId)!,
        points: r.points,
        time: r.guessTime,
      }))
      .filter((s) => s.player);

    return (
      <div className="flex h-full items-center justify-center p-4">
        <RoundResults
          roundNumber={gameState.round.currentTurn}
          answer={gameState.turn?.word}
          scorers={scorers}
          countdown={gameState.countdown}
        />
      </div>
    );
  }

  return (
    <GameLayout
      roomCode=""
      players={players}
      maxPlayers={12}
      currentUserId={currentUserId ?? undefined}
      activePlayerId={gameState.turn?.drawerId}
      timeRemaining={gameState.turn?.timeRemaining}
      totalTime={90} // from settings
      currentRound={gameState.round.roundNumber}
      totalRounds={gameState.round.totalRounds}
      statusText={statusText}
      onLeave={onLeave}
      sidebarContent={
        <div className="space-y-4">
          {/* Word hint or word (for drawer) */}
          {gameState.phase === 'drawing' && gameState.turn && (
            <div className="rounded-lg bg-muted/50 p-3">
              {isDrawer ? (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Your word:</div>
                  <div className="text-xl font-bold">{gameState.turn.word}</div>
                </div>
              ) : (
                <WordHintDisplay
                  pattern={gameState.turn.hint.pattern}
                  length={gameState.turn.hint.totalLength}
                  revealed={gameState.turn.hint.revealedCount}
                />
              )}
            </div>
          )}

          {/* Chat / Guesses */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {isDrawer ? 'Guesses' : 'Chat'}
            </h3>
            <ChatBox
              messages={messages}
              placeholder={
                isDrawer
                  ? 'You cannot chat while drawing'
                  : hasGuessed
                  ? 'You already guessed!'
                  : 'Type your guess...'
              }
              disabled={isDrawer || hasGuessed}
              onSendMessage={handleGuess}
              maxHeight={200}
            />
          </div>
        </div>
      }
      className={className}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Drawing toolbar (for drawer only) */}
        {isDrawer && gameState.phase === 'drawing' && (
          <DrawingToolbar
            settings={toolSettings}
            onChange={setToolSettings}
            onClear={clearCanvas}
            onUndo={undoStroke}
          />
        )}

        {/* Canvas */}
        <DrawingCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          isDrawer={isDrawer && gameState.phase === 'drawing'}
          strokes={gameState.strokes}
          toolSettings={toolSettings}
          onStroke={sendDrawStroke}
          onClear={clearCanvas}
          onUndo={undoStroke}
        />

        {/* Drawing indicator */}
        {!isDrawer && gameState.phase === 'drawing' && currentDrawer && (
          <div className="text-center text-sm text-muted-foreground">
            🎨 <span className="font-medium">{currentDrawer.name}</span> is drawing
          </div>
        )}
      </div>
    </GameLayout>
  );
}
