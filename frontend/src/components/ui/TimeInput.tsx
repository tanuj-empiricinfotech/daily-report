import { Input } from './input';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface TimeInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TimeInput({ label, value, onChange, error, className, ...props }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(value || '0:00');

  // Update display value when external value changes
  useEffect(() => {
    setDisplayValue(value || '0:00');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    onChange(inputValue);
  };

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
          placeholder="0:00"
          className={cn(error && 'aria-invalid', 'pr-6', className)}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          h
        </span>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

