/**
 * Word Picker Component
 *
 * Displays word choices for the drawer to select.
 */

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WordChoice } from '../types/skribbl.types';

interface WordPickerProps {
  /** Available word choices */
  choices: WordChoice[];
  /** Time remaining to pick */
  timeRemaining: number;
  /** Called when a word is selected */
  onSelectWord: (word: string) => void;
  /** Custom class name */
  className?: string;
}

/**
 * Get difficulty badge color
 */
function getDifficultyColor(difficulty: WordChoice['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'hard':
      return 'bg-red-100 text-red-700';
  }
}

export function WordPicker({
  choices,
  timeRemaining,
  onSelectWord,
  className,
}: WordPickerProps) {
  return (
    <Card className={cn('mx-auto max-w-md', className)}>
      <CardHeader className="text-center">
        <CardTitle>Choose a word to draw</CardTitle>
        <p className="text-sm text-muted-foreground">
          Time remaining: {timeRemaining}s
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {choices.map((choice) => (
            <Button
              key={choice.word}
              variant="outline"
              size="lg"
              className="h-auto justify-between py-4"
              onClick={() => onSelectWord(choice.word)}
            >
              <span className="text-lg font-medium">{choice.word}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  getDifficultyColor(choice.difficulty)
                )}
              >
                {choice.difficulty}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Word hint display component
 */
interface WordHintDisplayProps {
  /** Hint pattern (e.g., "_ _ g _ r") */
  pattern: string;
  /** Word length */
  length: number;
  /** Number of revealed letters */
  revealed: number;
  /** Custom class name */
  className?: string;
}

export function WordHintDisplay({
  pattern,
  length,
  revealed,
  className,
}: WordHintDisplayProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="mb-1 font-mono text-2xl tracking-widest">{pattern}</div>
      <div className="text-sm text-muted-foreground">
        {length} letters {revealed > 0 && `(${revealed} revealed)`}
      </div>
    </div>
  );
}

/**
 * Word reveal component (shown after turn ends)
 */
interface WordRevealProps {
  word: string;
  wasGuessed: boolean;
  className?: string;
}

export function WordReveal({ word, wasGuessed, className }: WordRevealProps) {
  return (
    <div className={cn('text-center', className)}>
      <p className="text-sm text-muted-foreground">The word was:</p>
      <p
        className={cn(
          'text-3xl font-bold',
          wasGuessed ? 'text-green-500' : 'text-foreground'
        )}
      >
        {word}
      </p>
    </div>
  );
}
