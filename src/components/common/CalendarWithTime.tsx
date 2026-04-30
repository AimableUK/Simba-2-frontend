"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { Clock2Icon, ChevronDownIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type TimeParts = {
  hour: string;
  minute: string;
  period: "AM" | "PM" | "";
};

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

function normalizeHour12(hour: number) {
  const normalized = hour % 12;
  return normalized === 0 ? 12 : normalized;
}

function getTimePartsFromISO(value: string): TimeParts {
  if (!value) {
    return { hour: "", minute: "", period: "" };
  }

  const date = new Date(value);
  if (!isValid(date)) {
    return { hour: "", minute: "", period: "" };
  }

  const hours = date.getHours();
  return {
    hour: String(normalizeHour12(hours)).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    period: hours >= 12 ? "PM" : "AM",
  };
}

function parseParts(parts: TimeParts) {
  const hour = Number.parseInt(parts.hour, 10);
  const minute = Number.parseInt(parts.minute, 10);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || !parts.period) {
    return null;
  }

  let normalizedHour = hour % 12;
  if (parts.period === "PM") {
    normalizedHour += 12;
  }

  return { hour: normalizedHour, minute };
}

function combineDateAndTime(date: Date, parts: TimeParts) {
  const parsed = parseParts(parts);
  if (!parsed) return null;

  const combined = cloneDate(date);
  combined.setHours(parsed.hour, parsed.minute, 0, 0);
  return combined;
}

function validatePickupTime(
  date: Date | undefined,
  parts: TimeParts,
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

  if (!parts.hour || !parts.minute || !parts.period) {
    return "Enter hour, minute, and AM/PM.";
  }

  const combined = combineDateAndTime(date, parts);
  if (!combined) {
    return "Enter a valid time.";
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
  const [tempParts, setTempParts] = React.useState<TimeParts>(
    getTimePartsFromISO(selectedTime),
  );
  const [timeError, setTimeError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTempDate(selectedDate);
      setTempParts(getTimePartsFromISO(selectedTime));
      setTimeError("");
    }
  }, [open, selectedDate, selectedTime]);

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const now = new Date();
      const lowerBound = toStartOfDay(now);
      const upperBound = toStartOfDay(now);
      upperBound.setDate(upperBound.getDate() + maxDaysAhead);

      return date < lowerBound || date > upperBound;
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
    const error = validatePickupTime(tempDate, tempParts, {
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

    const combined = combineDateAndTime(tempDate, tempParts);
    if (!combined) {
      setTimeError("Enter a valid time.");
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
      setTempParts(getTimePartsFromISO(selectedTime));
      setTimeError("");
    }
  };

  const handlePartChange = (key: keyof TimeParts, value: string) => {
    const nextParts = { ...tempParts, [key]: value } as TimeParts;
    setTempParts(nextParts);
    setTimeError(
      validatePickupTime(tempDate, nextParts, {
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
              "w-full justify-between rounded-lg px-3 py-3 text-left font-normal",
              triggerClassName,
            )}
          >
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Clock2Icon className="h-3.5 w-3.5 text-primary" />
                {title}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {triggerLabel}
              </span>
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "w-[min(90vw,360px)] overflow-hidden rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl",
            contentClassName,
          )}
        >
          <div className="border-b border-border bg-card px-3 py-2.5">
            <p className="text-sm font-semibold">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="space-y-2.5 bg-card p-2.5">
            <div
              className={cn(
                "rounded-xl border border-border/70 bg-background p-1.5",
                calendarClassName,
              )}
            >
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                disabled={isDateDisabled}
                className="w-full [--cell-size:1.45rem] p-0.5"
              />
            </div>

            <div className="space-y-1.5">
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="pickup-hour-input"
                >
                  {timeLabel}
                </label>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    id="pickup-hour-input"
                    inputMode="numeric"
                    placeholder="HH"
                    value={tempParts.hour}
                    onChange={(e) => handlePartChange("hour", e.target.value)}
                    className="h-9 rounded-lg bg-background text-center"
                    maxLength={2}
                  />
                  <Input
                    id="pickup-minute-input"
                    inputMode="numeric"
                    placeholder="MM"
                    value={tempParts.minute}
                    onChange={(e) => handlePartChange("minute", e.target.value)}
                    className="h-9 rounded-lg bg-background text-center"
                    maxLength={2}
                  />
                  <Select
                    value={tempParts.period}
                    onValueChange={(value) =>
                      handlePartChange("period", value as TimeParts["period"])
                    }
                  >
                    <SelectTrigger className="h-9 w-[82px] rounded-lg bg-background">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {timeError ? (
                <p className="text-xs text-destructive">{timeError}</p>
              ) : null}

              <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5">
                <div className="grid gap-1.5 text-sm">
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
                      {tempParts.hour && tempParts.minute && tempParts.period
                        ? `${tempParts.hour}:${tempParts.minute} ${tempParts.period}`
                        : "-"}
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

          <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-3 py-2.5">
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
              disabled={!tempDate || !tempParts.hour || !tempParts.minute || !tempParts.period}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
