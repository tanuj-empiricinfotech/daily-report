import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const iconClass = cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5');

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            !readonly && 'hover:text-yellow-400 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          {value !== null && value >= star ? (
            <IconStarFilled className={cn(iconClass, 'text-yellow-400')} />
          ) : (
            <IconStar className={cn(iconClass, 'text-muted-foreground')} />
          )}
        </button>
      ))}
    </div>
  );
}
