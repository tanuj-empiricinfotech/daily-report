"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IconCalendar } from "@tabler/icons-react"

interface CalendarDatePickerProps {
  label?: string
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  className?: string
  error?: string
  placeholder?: string
}

/**
 * Calendar Date Picker Component
 * Single date picker with calendar popup UI
 * Following Clean Code principles - reusable, type-safe
 */
export function CalendarDatePicker({
  label,
  value,
  onChange,
  className,
  error,
  placeholder = "Pick a date",
}: CalendarDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined
    return typeof value === 'string' ? new Date(value) : value
  })

  // Sync internal state with external value
  React.useEffect(() => {
    if (value) {
      setDate(typeof value === 'string' ? new Date(value) : value)
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onChange) {
      onChange(selectedDate)
    }
    // Close popover after selection
    setOpen(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <IconCalendar className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "LLL dd, y")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={date}
            selected={date}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
