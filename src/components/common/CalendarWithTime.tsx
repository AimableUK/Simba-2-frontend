"use client";

import * as React from "react";
import { format } from "date-fns";
import { Clock2Icon, ChevronDownIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PickupSlot = {
  date: Date;
  value: string;
  label: string;
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
  timeGridClassName?: string;
  locale?: string;
  openingHour?: number;
  closingHour?: number;
  intervalMinutes?: number;
  leadTimeMinutes?: number;
  maxDaysAhead?: number;
}

const DEFAULT_OPENING_HOUR = 8;
const DEFAULT_CLOSING_HOUR = 20;
const DEFAULT_INTERVAL_MINUTES = 30;
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

export function buildPickupSlots(
  selectedDate: Date,
  {
    openingHour = DEFAULT_OPENING_HOUR,
    closingHour = DEFAULT_CLOSING_HOUR,
    intervalMinutes = DEFAULT_INTERVAL_MINUTES,
    leadTimeMinutes = DEFAULT_LEAD_TIME_MINUTES,
    maxDaysAhead = DEFAULT_MAX_DAYS_AHEAD,
  }: Partial<
    Pick<
      CalendarWithTimeProps,
      "openingHour" | "closingHour" | "intervalMinutes" | "leadTimeMinutes" | "maxDaysAhead"
    >
  > = {},
): PickupSlot[] {
  const now = new Date();
  const dayStart = toStartOfDay(selectedDate);
  const todayStart = toStartOfDay(now);
  const maxDate = toStartOfDay(now);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  if (dayStart < todayStart || dayStart > maxDate) {
    return [];
  }

  const slots: PickupSlot[] = [];

  for (let hour = openingHour; hour < closingHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const slotDate = cloneDate(selectedDate);
      slotDate.setHours(hour, minute, 0, 0);

      if (
        slotDate.getTime() < now.getTime() + leadTimeMinutes * 60 * 1000 ||
        slotDate.getHours() < openingHour ||
        slotDate.getHours() >= closingHour
      ) {
        continue;
      }

      slots.push({
        date: slotDate,
        value: slotDate.toISOString(),
        label: format(slotDate, "h:mm a"),
      });
    }
  }

  return slots.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function findFirstPickupSlot(
  {
    openingHour = DEFAULT_OPENING_HOUR,
    closingHour = DEFAULT_CLOSING_HOUR,
    intervalMinutes = DEFAULT_INTERVAL_MINUTES,
    leadTimeMinutes = DEFAULT_LEAD_TIME_MINUTES,
    maxDaysAhead = DEFAULT_MAX_DAYS_AHEAD,
  }: Partial<
    Pick<
      CalendarWithTimeProps,
      "openingHour" | "closingHour" | "intervalMinutes" | "leadTimeMinutes" | "maxDaysAhead"
    >
  > = {},
) {
  const now = new Date();

  for (let dayOffset = 0; dayOffset <= maxDaysAhead; dayOffset += 1) {
    const candidateDate = cloneDate(now);
    candidateDate.setDate(now.getDate() + dayOffset);

    const slots = buildPickupSlots(candidateDate, {
      openingHour,
      closingHour,
      intervalMinutes,
      leadTimeMinutes,
      maxDaysAhead,
    });

    if (slots.length > 0) {
      return {
        date: slots[0].date,
        value: slots[0].value,
      };
    }
  }

  return null;
}

function formatSelectedDate(date: Date, locale = "en") {
  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
  timeGridClassName,
  locale = "en",
  openingHour = DEFAULT_OPENING_HOUR,
  closingHour = DEFAULT_CLOSING_HOUR,
  intervalMinutes = DEFAULT_INTERVAL_MINUTES,
  leadTimeMinutes = DEFAULT_LEAD_TIME_MINUTES,
  maxDaysAhead = DEFAULT_MAX_DAYS_AHEAD,
}: CalendarWithTimeProps) {
  const [open, setOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(selectedDate);
  const [tempTime, setTempTime] = React.useState(selectedTime);

  const availableSlots = React.useMemo(
    () =>
      tempDate
        ? buildPickupSlots(tempDate, {
            openingHour,
            closingHour,
            intervalMinutes,
            leadTimeMinutes,
            maxDaysAhead,
          })
        : [],
    [
      closingHour,
      intervalMinutes,
      leadTimeMinutes,
      maxDaysAhead,
      openingHour,
      tempDate,
    ],
  );

  React.useEffect(() => {
    if (open) {
      setTempDate(selectedDate);
      setTempTime(selectedTime);
    }
  }, [open, selectedDate, selectedTime]);

  React.useEffect(() => {
    if (!selectedDate) {
      if (selectedTime) {
        onTimeChange("");
      }
      return;
    }

    const slots = buildPickupSlots(selectedDate, {
      openingHour,
      closingHour,
      intervalMinutes,
      leadTimeMinutes,
      maxDaysAhead,
    });

    if (!slots.length) {
      return;
    }

    const validTimes = new Set(slots.map((slot) => slot.value));
    if (!validTimes.has(selectedTime)) {
      onTimeChange(slots[0].value);
    }
  }, [
    closingHour,
    intervalMinutes,
    leadTimeMinutes,
    maxDaysAhead,
    onTimeChange,
    openingHour,
    selectedDate,
    selectedTime,
  ]);

  const isDateDisabled = React.useCallback(
    (date: Date) =>
      buildPickupSlots(date, {
        openingHour,
        closingHour,
        intervalMinutes,
        leadTimeMinutes,
        maxDaysAhead,
      }).length === 0,
    [closingHour, intervalMinutes, leadTimeMinutes, maxDaysAhead, openingHour],
  );

  const activeDate = selectedDate ?? tempDate;
  const triggerLabel =
    activeDate && selectedTime
      ? `${formatSelectedDate(activeDate, locale)} · ${format(
          new Date(selectedTime),
          "h:mm a",
        )}`
      : title;

  const handleApply = () => {
    onDateChange(tempDate);
    onTimeChange(tempTime);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTempDate(selectedDate);
      setTempTime(selectedTime);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between rounded-xl px-4 py-6 text-left font-normal",
              triggerClassName,
            )}
          >
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Clock2Icon className="h-4 w-4 text-primary" />
                {title}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {triggerLabel}
              </span>
            </span>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "w-[min(92vw,560px)] overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl",
            contentClassName,
          )}
        >
          <div className="border-b border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="grid gap-3 bg-card p-3 md:grid-cols-[0.92fr_1.08fr]">
            <div
              className={cn(
                "rounded-2xl border border-border/70 bg-background p-2",
                calendarClassName,
              )}
            >
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                disabled={isDateDisabled}
                className="w-full [--cell-size:1.75rem] p-1"
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium">{timeLabel}</p>
                {tempDate ? (
                  <div
                    className={cn(
                      "grid grid-cols-2 gap-2 sm:grid-cols-3",
                      timeGridClassName,
                    )}
                  >
                    {availableSlots.map((slot) => {
                      const active = slot.value === tempTime;

                      return (
                        <Button
                          key={slot.value}
                          type="button"
                          variant={active ? "default" : "outline"}
                          onClick={() => setTempTime(slot.value)}
                          className="justify-start rounded-xl px-3 text-sm"
                        >
                          {slot.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-sm text-muted-foreground">
                    Select a date first to see available times.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {dateLabel}
                    </p>
                    <p className="mt-1 font-medium">
                      {tempDate ? formatSelectedDate(tempDate, locale) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {timeLabel}
                    </p>
                    <p className="mt-1 font-medium">
                      {tempTime ? format(new Date(tempTime), "h:mm a") : "-"}
                    </p>
                  </div>
                </div>
                {note ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
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
