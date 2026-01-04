import { Input } from './input';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface TimeInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Normalizes time input to HH:MM format
 * - "8" → "8:00"
 * - "3:30" → "3:30"
 * - "" → "0:00"
 */
const normalizeTimeInput = (input: string): string => {
  const trimmed = input.trim();

  // Empty input
  if (!trimmed) return '0:00';

  // Already in HH:MM format
  if (trimmed.includes(':')) {
    return trimmed;
  }

  // Single number - convert to hours
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 0) {
    return `${num}:00`;
  }

  return trimmed;
};

/**
 * Validates time format and returns error message if invalid
 */
const validateTimeInput = (input: string): string | undefined => {
  const trimmed = input.trim();

  // Empty is valid
  if (!trimmed || trimmed === '0:00') return undefined;

  // Must contain colon for HH:MM format
  if (!trimmed.includes(':')) {
    // Check if it's a valid number (will be converted on blur)
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 0) {
      return 'Please enter a valid time (e.g., 3:30 or 3)';
    }
    return undefined; // Valid number, will be converted on blur
  }

  const parts = trimmed.split(':');
  if (parts.length !== 2) {
    return 'Invalid time format. Use HH:MM (e.g., 3:30)';
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return 'Invalid time. Hours and minutes must be numbers';
  }

  if (hours < 0) {
    return 'Hours cannot be negative';
  }

  if (minutes < 0) {
    return 'Minutes cannot be negative';
  }

  if (minutes >= 60) {
    return 'Invalid time. Minutes must be less than 60';
  }

  return undefined;
};

export function TimeInput({ label, value, onChange, error, className, ...props }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(value || '0:00');
  const [validationError, setValidationError] = useState<string | undefined>();

  // Update display value when external value changes
  useEffect(() => {
    setDisplayValue(value || '0:00');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Validate on change
    const error = validateTimeInput(inputValue);
    setValidationError(error);

    // Always update parent with current value
    onChange(inputValue);
  };

  const handleBlur = () => {
    // Normalize the input on blur (convert "8" to "8:00")
    const normalized = normalizeTimeInput(displayValue);
    setDisplayValue(normalized);
    onChange(normalized);

    // Validate the normalized value
    const error = validateTimeInput(normalized);
    setValidationError(error);
  };

  // Use validation error or external error
  const displayError = validationError || error;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0:00"
          className={cn(displayError && 'aria-invalid', 'pr-6', className)}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          h
        </span>
      </div>
      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}

