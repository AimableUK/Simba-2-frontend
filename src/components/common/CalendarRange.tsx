"use client";

import { useState, useEffect } from "react";
import { format, endOfDay } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CalendarRangeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DateRange | undefined;
  onValueChange: (value: DateRange | undefined) => void;
  onApply: () => void | boolean;
  onCancel: () => void;
  title: string;
  description: string;
  placeholder: string;
  fromLabel: string;
  toLabel: string;
  cancelLabel: string;
  applyLabel: string;
  className?: string;
}

function formatRangeLabel(value: DateRange | undefined, placeholder: string) {
  if (!value?.from && !value?.to) return placeholder;
  if (value.from && value.to) {
    return `${format(value.from, "MMM d")} - ${format(value.to, "MMM d")}`;
  }
  if (value.from) return format(value.from, "MMM d, yyyy");
  return placeholder;
}

export function CalendarRange({
  open,
  onOpenChange,
  value,
  onValueChange,
  onApply,
  onCancel,
  title,
  description,
  placeholder,
  fromLabel,
  toLabel,
  cancelLabel,
  applyLabel,
  className,
}: CalendarRangeProps) {
  const [tempValue, setTempValue] = useState<DateRange | undefined>(value);

  // Sync internal state with prop when popover opens
  useEffect(() => {
    if (open) {
      setTempValue(value);
    }
  }, [open, value]);

  const label = formatRangeLabel(value, placeholder);

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleApply = () => {
    onValueChange(tempValue);
    // Use setTimeout to ensure state update propagates before closing/applying
    setTimeout(() => {
      const shouldClose = onApply();
      if (shouldClose !== false) onOpenChange(false);
    }, 0);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-[190px] justify-start text-left font-normal",
            !value?.from && !value?.to && "text-muted-foreground",
            className,
          )}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="p-3">
          <Calendar
            mode="range"
            selected={tempValue}
            onSelect={setTempValue}
            numberOfMonths={2}
            disabled={(date) =>
              date > endOfDay(new Date()) || date < new Date("1900-01-01")
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{fromLabel}:</span>{" "}
            {tempValue?.from ? format(tempValue.from, "MMM d, yyyy") : "—"}
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{toLabel}:</span>{" "}
            {tempValue?.to ? format(tempValue.to, "MMM d, yyyy") : "—"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!tempValue?.from || !tempValue?.to}
            >
              {applyLabel}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
