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
  /** mapping from "yyyy-MM-dd" to booking count */
  bookingCounts?: Record<string, number>;
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  viewDate,
  onViewDateChange,
  bookingCounts,
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
          const count = bookingCounts?.[key] ?? 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex h-8 w-full flex-col items-center justify-center rounded-md text-[11px] transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "text-foreground hover:bg-secondary",
                isSelected &&
                "bg-emphasis text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "ring-1 ring-primary/40"
              )}
            >
              {format(day, "d")}
              {count > 0 && (
                <span
                  className={cn(
                    "text-[9px] absolute -top-2 -left-2 leading-none font-medium tabular-nums",
                    isSelected ? "text-primary-foreground bg-red-500 p-1 rounded-full  w-4 h-4" : "text-primary-foreground bg-neutral-300 p-1 rounded-full  w-4 h-4 /20"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
