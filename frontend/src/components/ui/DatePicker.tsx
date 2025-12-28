import { Input } from './input';
import { cn } from '@/lib/utils';

interface DatePickerProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
}

export function DatePicker({ label, error, className, ...props }: DatePickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Input
        type="date"
        className={cn(error && 'aria-invalid', className)}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

