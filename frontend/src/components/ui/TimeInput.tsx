import { Input } from './input';
import { cn } from '@/lib/utils';
import { parseTimeInput } from '@/utils/time';

interface TimeInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function TimeInput({ label, value, onChange, error, className, ...props }: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseTimeInput(e.target.value);
    onChange(parsed);
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
          type="number"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={handleChange}
          placeholder="0.00"
          className={cn(error && 'aria-invalid', className)}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          hours
        </span>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

