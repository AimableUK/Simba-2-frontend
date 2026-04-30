"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { Clock2Icon, ChevronDownIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CalendarWithTimeProps {
  title: string;
  description?: string;
  selectedDate: Date | undefined;
  selectedTime: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  note?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  calendarClassName?: string;
  locale?: string;
  openingHour?: number;
  closingHour?: number;
  leadTimeMinutes?: number;
  maxDaysAhead?: number;
}

const DEFAULT_OPENING_HOUR = 8;
const DEFAULT_CLOSING_HOUR = 20;
const DEFAULT_LEAD_TIME_MINUTES = 60;
const DEFAULT_MAX_DAYS_AHEAD = 3;

function toStartOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function cloneDate(date: Date) {
  return new Date(date.getTime());
}

function formatSelectedDate(date: Date, locale = "en") {
  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function parseTimeValue(value: string) {
  const parsed = parse(value, "HH:mm", new Date());
  return isValid(parsed) ? parsed : null;
}

function combineDateAndTime(date: Date, timeValue: string) {
  const parsedTime = parseTimeValue(timeValue);
  if (!parsedTime) return null;

  const combined = cloneDate(date);
  combined.setHours(parsedTime.getHours(), parsedTime.getMinutes(), 0, 0);
  return combined;
}

function validatePickupTime(
  date: Date | undefined,
  timeValue: string,
  {
    openingHour,
    closingHour,
    leadTimeMinutes,
    maxDaysAhead,
  }: Required<
    Pick<
      CalendarWithTimeProps,
      "openingHour" | "closingHour" | "leadTimeMinutes" | "maxDaysAhead"
    >
  >,
) {
  if (!date) {
    return "Select a date first.";
  }

  const combined = combineDateAndTime(date, timeValue);
  if (!combined) {
    return "Enter a valid time in HH:MM format.";
  }

  const now = new Date();
  const minDate = toStartOfDay(now);
  const maxDate = toStartOfDay(now);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  if (date < minDate || date > maxDate) {
    return `Choose a date within the next ${maxDaysAhead + 1} days.`;
  }

  if (combined.getTime() < now.getTime() + leadTimeMinutes * 60 * 1000) {
    return `Choose a time at least ${leadTimeMinutes} minutes from now.`;
  }

  const hour = combined.getHours();
  if (hour < openingHour || hour >= closingHour) {
    return `Choose a time between ${String(openingHour).padStart(2, "0")}:00 and ${String(
      closingHour,
    ).padStart(2, "0")}:00.`;
  }

  return "";
}

export function CalendarWithTime({
  title,
  description,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  note,
  className,
  triggerClassName,
  contentClassName,
  calendarClassName,
  locale = "en",
  openingHour = DEFAULT_OPENING_HOUR,
  closingHour = DEFAULT_CLOSING_HOUR,
  leadTimeMinutes = DEFAULT_LEAD_TIME_MINUTES,
  maxDaysAhead = DEFAULT_MAX_DAYS_AHEAD,
}: CalendarWithTimeProps) {
  const [open, setOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(selectedDate);
  const [tempTime, setTempTime] = React.useState(selectedTime);
  const [timeError, setTimeError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTempDate(selectedDate);
      setTempTime(selectedTime ? format(new Date(selectedTime), "HH:mm") : "");
      setTimeError("");
    }
  }, [open, selectedDate, selectedTime]);

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const now = new Date();
      const lowerBound = toStartOfDay(now);
      const upperBound = toStartOfDay(now);
      upperBound.setDate(upperBound.getDate() + maxDaysAhead);

      if (date < lowerBound || date > upperBound) {
        return true;
      }

      return false;
    },
    [maxDaysAhead],
  );

  const activeDate = selectedDate ?? tempDate;
  const triggerLabel =
    activeDate && selectedTime
      ? `${formatSelectedDate(activeDate, locale)} - ${format(
          new Date(selectedTime),
          "h:mm a",
        )}`
      : title;

  const handleApply = () => {
    const error = validatePickupTime(tempDate, tempTime, {
      openingHour,
      closingHour,
      leadTimeMinutes,
      maxDaysAhead,
    });

    if (error) {
      setTimeError(error);
      return;
    }

    if (!tempDate) {
      setTimeError("Select a date first.");
      return;
    }

    const combined = combineDateAndTime(tempDate, tempTime);
    if (!combined) {
      setTimeError("Enter a valid time in HH:MM format.");
      return;
    }

    onDateChange(tempDate);
    onTimeChange(combined.toISOString());
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTempDate(selectedDate);
      setTempTime(selectedTime);
      setTimeError("");
    }
  };

  const handleTimeChange = (value: string) => {
    setTempTime(value);
    setTimeError(
      validatePickupTime(tempDate, value, {
        openingHour,
        closingHour,
        leadTimeMinutes,
        maxDaysAhead,
      }),
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between rounded-xl px-5 py-5 text-left font-normal sm:px-6 sm:py-6",
              triggerClassName,
            )}
          >
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="flex items-center gap-2 text-base font-medium sm:text-[1.05rem]">
                <Clock2Icon className="h-5 w-5 text-primary" />
                {title}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {triggerLabel}
              </span>
            </span>
            <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "w-[min(96vw,720px)] overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl sm:w-[min(92vw,720px)]",
            contentClassName,
          )}
        >
          <div className="border-b border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="space-y-4 bg-card p-4 sm:p-5">
            <div
              className={cn(
                "rounded-2xl border border-border/70 bg-background p-3 sm:p-4",
                calendarClassName,
              )}
            >
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                disabled={isDateDisabled}
                className="w-full [--cell-size:2.1rem] p-1 sm:[--cell-size:2.35rem]"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="pickup-time-input">
                  {timeLabel}
                </label>
                <Input
                  id="pickup-time-input"
                  type="time"
                  step={60}
                  value={tempTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="h-11 rounded-xl bg-background sm:h-12"
                />
              </div>

              {timeError ? (
                <p className="text-xs text-destructive">{timeError}</p>
              ) : null}

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {dateLabel}
                    </span>
                    <span className="font-medium">
                      {tempDate ? formatSelectedDate(tempDate, locale) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {timeLabel}
                    </span>
                    <span className="font-medium">
                      {tempTime || "-"}
                    </span>
                  </div>
                </div>
                {note ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {note}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={!tempDate || !tempTime}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
