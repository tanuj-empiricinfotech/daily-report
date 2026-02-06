/**
 * Timer Component
 *
 * Displays a countdown timer with visual progress indicator.
 */

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TimerProps {
  /** Duration in seconds */
  duration: number;
  /** Time remaining in seconds (controlled mode) */
  timeRemaining?: number;
  /** Whether the timer is active */
  isActive?: boolean;
  /** Callback when timer expires */
  onExpire?: () => void;
  /** Callback for each tick */
  onTick?: (remaining: number) => void;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show progress bar */
  showProgress?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get color based on remaining time percentage
 */
function getTimeColor(remaining: number, total: number): string {
  const percentage = (remaining / total) * 100;
  if (percentage <= 10) return 'text-red-500';
  if (percentage <= 25) return 'text-orange-500';
  if (percentage <= 50) return 'text-yellow-500';
  return 'text-foreground';
}

export function Timer({
  duration,
  timeRemaining: controlledTime,
  isActive = true,
  onExpire,
  onTick,
  size = 'md',
  showProgress = true,
  className,
}: TimerProps) {
  // Use controlled time if provided, otherwise manage internally
  const [internalTime, setInternalTime] = useState(duration);
  const timeRemaining = controlledTime ?? internalTime;

  const progress = (timeRemaining / duration) * 100;
  const isLowTime = timeRemaining <= duration * 0.25;

  // Internal countdown logic (only when not controlled)
  useEffect(() => {
    if (controlledTime !== undefined || !isActive) return;

    const interval = setInterval(() => {
      setInternalTime((prev) => {
        const next = Math.max(0, prev - 1);
        onTick?.(next);
        if (next === 0) {
          onExpire?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [controlledTime, isActive, onExpire, onTick]);

  // Call onTick for controlled mode
  useEffect(() => {
    if (controlledTime !== undefined) {
      onTick?.(controlledTime);
      if (controlledTime === 0) {
        onExpire?.();
      }
    }
  }, [controlledTime, onExpire, onTick]);

  // Reset internal time when duration changes
  useEffect(() => {
    if (controlledTime === undefined) {
      setInternalTime(duration);
    }
  }, [duration, controlledTime]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Time display */}
      <div
        className={cn(
          'font-mono font-bold tabular-nums transition-colors',
          sizeClasses[size],
          getTimeColor(timeRemaining, duration),
          isLowTime && isActive && 'animate-pulse'
        )}
      >
        {formatTime(timeRemaining)}
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="h-2 w-full max-w-32 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              progress > 50 && 'bg-green-500',
              progress > 25 && progress <= 50 && 'bg-yellow-500',
              progress > 10 && progress <= 25 && 'bg-orange-500',
              progress <= 10 && 'bg-red-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing timer state
 */
export function useTimer(
  duration: number,
  options?: {
    autoStart?: boolean;
    onExpire?: () => void;
    onTick?: (remaining: number) => void;
  }
) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(options?.autoStart ?? false);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback(() => {
    setTimeRemaining(duration);
    setIsActive(false);
  }, [duration]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        options?.onTick?.(next);
        if (next === 0) {
          setIsActive(false);
          options?.onExpire?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, options]);

  return {
    timeRemaining,
    isActive,
    isExpired: timeRemaining === 0,
    progress: (timeRemaining / duration) * 100,
    start,
    pause,
    reset,
    setTime: setTimeRemaining,
  };
}
