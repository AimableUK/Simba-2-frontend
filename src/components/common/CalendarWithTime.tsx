"use client";

import * as React from "react";
import { format } from "date-fns";
import { Clock2Icon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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

  for (
    let hour = openingHour;
    hour < closingHour;
    hour += Math.max(1, Math.floor(intervalMinutes / 60) || 1)
  ) {
    const minuteStep = Math.max(1, intervalMinutes);

    for (let minute = 0; minute < 60; minute += minuteStep) {
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
  calendarClassName,
  timeGridClassName,
  locale = "en",
  openingHour = DEFAULT_OPENING_HOUR,
  closingHour = DEFAULT_CLOSING_HOUR,
  intervalMinutes = DEFAULT_INTERVAL_MINUTES,
  leadTimeMinutes = DEFAULT_LEAD_TIME_MINUTES,
  maxDaysAhead = DEFAULT_MAX_DAYS_AHEAD,
}: CalendarWithTimeProps) {
  const availableSlots = React.useMemo(
    () =>
      selectedDate
        ? buildPickupSlots(selectedDate, {
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
      selectedDate,
    ],
  );

  React.useEffect(() => {
    if (!selectedDate) {
      if (selectedTime) {
        onTimeChange("");
      }
      return;
    }

    if (availableSlots.some((slot) => slot.value === selectedTime)) {
      return;
    }

    onTimeChange(availableSlots[0]?.value ?? "");
  }, [availableSlots, onTimeChange, selectedDate, selectedTime]);

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const now = new Date();
      const lowerBound = toStartOfDay(now);
      const upperBound = toStartOfDay(now);
      upperBound.setDate(upperBound.getDate() + maxDaysAhead);
      if (date < lowerBound || date > upperBound) {
        return true;
      }

      return (
        buildPickupSlots(date, {
          openingHour,
          closingHour,
          intervalMinutes,
          leadTimeMinutes,
        }).length === 0
      );
    },
    [closingHour, intervalMinutes, leadTimeMinutes, maxDaysAhead, openingHour],
  );

  const formattedDate = selectedDate
    ? formatSelectedDate(selectedDate, locale)
    : "—";
  const formattedTime = selectedTime
    ? format(new Date(selectedTime), "h:mm a")
    : "—";

  return (
    <Card className={cn("rounded-2xl border-border/80 shadow-sm", className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock2Icon className="h-5 w-5 text-primary" />
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className={cn("rounded-2xl border border-border/70 p-2", calendarClassName)}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              disabled={isDateDisabled}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">{timeLabel}</p>
              {selectedDate ? (
                <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", timeGridClassName)}>
                  {availableSlots.map((slot) => {
                    const active = slot.value === selectedTime;

                    return (
                      <Button
                        key={slot.value}
                        type="button"
                        variant={active ? "default" : "outline"}
                        onClick={() => onTimeChange(slot.value)}
                        className={cn(
                          "justify-start rounded-xl px-3 text-sm",
                          active && "shadow-sm",
                        )}
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

            <div className="rounded-xl bg-muted/30 p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {dateLabel}
                  </p>
                  <p className="mt-1 font-medium">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {timeLabel}
                  </p>
                  <p className="mt-1 font-medium">{formattedTime}</p>
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
      </CardContent>
      <CardFooter className="border-t border-border/60 px-5 py-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          Pickup slots are limited to business hours and the next {maxDaysAhead + 1} days.
        </p>
      </CardFooter>
    </Card>
  );
}
