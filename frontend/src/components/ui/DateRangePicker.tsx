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
import type { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  label?: string
  value?: { from?: Date | string; to?: Date | string }
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void
  className?: string
  error?: string
}

export function DateRangePicker({
  label,
  value,
  onChange,
  className,
  error,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (!value) return undefined
    return {
      from: value.from ? (typeof value.from === 'string' ? new Date(value.from) : value.from) : undefined,
      to: value.to ? (typeof value.to === 'string' ? new Date(value.to) : value.to) : undefined,
    }
  })

  React.useEffect(() => {
    if (value) {
      setDate({
        from: value.from ? (typeof value.from === 'string' ? new Date(value.from) : value.from) : undefined,
        to: value.to ? (typeof value.to === 'string' ? new Date(value.to) : value.to) : undefined,
      })
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    
    // Only close the popover when both dates are selected
    if (range?.from && range?.to) {
      if (onChange) {
        onChange({ from: range.from, to: range.to })
      }
      setOpen(false)
    } else if (range?.from) {
      // First date selected, keep popover open
      if (onChange) {
        onChange({ from: range.from, to: undefined })
      }
    } else {
      // Range cleared
      if (onChange) {
        onChange(undefined)
      }
    }
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
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
