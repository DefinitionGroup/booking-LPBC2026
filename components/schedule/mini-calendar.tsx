"use client";


import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  /** day keys ("yyyy-MM-dd") that have bookings */
  busyDays?: Set<string>;
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  viewDate,
  onViewDateChange,
  busyDays,
}: MiniCalendarProps) {
  const { t, locale } = useI18n();
  const dateLocale = getDateFnsLocale(locale);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekdayLabels = [
    t("calendar.weekdaySun"),
    t("calendar.weekdayMon"),
    t("calendar.weekdayTue"),
    t("calendar.weekdayWed"),
    t("calendar.weekdayThu"),
    t("calendar.weekdayFri"),
    t("calendar.weekdaySat"),
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs tracking-tight">
          {format(viewDate, "MMMM yyyy", { locale: dateLocale })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewDateChange(subMonths(viewDate, 1))}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("calendar.previousMonth")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              onViewDateChange(new Date());
              onSelectDate(new Date());
            }}
            className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {t("common.today")}
          </button>
          <button
            type="button"
            onClick={() => onViewDateChange(addMonths(viewDate, 1))}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("calendar.nextMonth")}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label.charAt(0)}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasBusy = busyDays?.has(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative grid h-7 w-full place-items-center rounded-md text-[11px] transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "text-foreground hover:bg-secondary",
                isSelected &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "ring-1 ring-primary/40"
              )}
            >
              {format(day, "d")}
              {hasBusy && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
