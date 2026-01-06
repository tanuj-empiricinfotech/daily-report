/**
 * MultiSelect Component
 * Dropdown with checkboxes for multi-selection
 * Following clean code principles - reusable, type-safe
 */

import { useState, useMemo } from 'react';
import { IconCheck, IconChevronDown, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  /** Label for the select */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Available options */
  options: MultiSelectOption[];
  /** Currently selected values */
  value: (string | number)[];
  /** Change handler */
  onChange: (value: (string | number)[]) => void;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

const MAX_DISPLAY_BADGES = 2;

export function MultiSelect({
  label,
  placeholder = 'Select items...',
  options,
  value,
  onChange,
  loading = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Toggle selection
  const handleToggle = (optionValue: string | number) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  // Clear all selections
  const handleClearAll = () => {
    onChange([]);
  };

  // Select all
  const handleSelectAll = () => {
    onChange(options.map((opt) => opt.value));
  };

  // Get selected labels
  const selectedLabels = useMemo(() => {
    return options
      .filter((opt) => value.includes(opt.value))
      .map((opt) => opt.label);
  }, [options, value]);

  // Display text
  const displayText = useMemo(() => {
    if (value.length === 0) {
      return placeholder;
    }
    if (value.length === options.length) {
      return 'All selected';
    }
    return `${value.length} selected`;
  }, [value, options.length, placeholder]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={loading}
          >
            <span className="truncate">{displayText}</span>
            <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64" align="start">
          {/* Action buttons */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs"
              disabled={value.length === 0}
            >
              Clear
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggle(option.value);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/50'
                        )}
                      >
                        {isSelected && <IconCheck className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.slice(0, MAX_DISPLAY_BADGES).map((label, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const optionValue = options.find((opt) => opt.label === label)?.value;
                  if (optionValue) {
                    handleToggle(optionValue);
                  }
                }}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <IconX className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {selectedLabels.length > MAX_DISPLAY_BADGES && (
            <Badge variant="secondary" className="text-xs">
              +{selectedLabels.length - MAX_DISPLAY_BADGES} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
